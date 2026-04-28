import re
import json
import subprocess
import difflib
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
from collections import defaultdict

from db.db import get_connection, get_or_create_category, get_historical_vendor_mappings
from tool.logging_config import logger

MODEL_NAME = "llama3.1:8b"
PROMPTS_DIR = Path("prompts")

def detect_bank(text: str) -> str:
    text_lower = text.lower()
    if "mbna" in text_lower:
        return "mbna"
    elif "cibc" in text_lower:
        return "cibc"
    elif "scotiabank" in text_lower or "bank of nova scotia" in text_lower:
        return "scotiabank"
    return "default"

def load_bank_prompt(bank_id: str) -> str:
    prompt_file = PROMPTS_DIR / f"{bank_id}.md"
    if prompt_file.exists():
        with open(prompt_file, "r", encoding="utf-8") as f:
            return f.read()
    
    return """
        You are a data extraction engine. Output valid JSON with keys: 
        "date", "vendor_raw", "vendor_normalized", "category", "amount".
    """

def get_dynamic_rules_prompt() -> str:
    """
    Fetches user-defined rules from the database and formats them as Few-Shot 
    learning examples for the LLM to use during semantic matching.
    """
    conn = get_connection()
    rows = conn.execute("""
        SELECT vm.raw_vendor, vm.normalized_vendor, c.name as category_name
        FROM vendor_mapping vm
        LEFT JOIN categories c ON vm.category_id = c.id
    """).fetchall()
    conn.close()
    
    if not rows:
        return "\n**KNOWN VENDOR RULES:**\nNo rules defined yet. Set vendor_normalized and category to null."
        
    rules_text = "\n**KNOWN VENDOR RULES:**\n"
    
    # Group raw examples by the normalized vendor to save context tokens
    # e.g. Amazon -> [AMZN Mktp CA*B80, Amazon.ca*BT30J]
    grouped = defaultdict(lambda: {"category": "", "raw_examples": []})
    for r in rows:
        norm = r["normalized_vendor"]
        grouped[norm]["category"] = r["category_name"]
        grouped[norm]["raw_examples"].append(r["raw_vendor"])
        
    for norm, data in grouped.items():
        # Limit to the 4 most recent raw examples to keep the prompt lean
        examples = "', '".join(data["raw_examples"][-4:]) 
        cat = data["category"]
        rules_text += f"- If raw text semantically matches '{examples}', map to vendor_normalized: '{norm}' and category: '{cat}'.\n"
        
    return rules_text

def extract_transaction_lines(text: str, bank_id: str) -> List[str]:
    lines = text.splitlines() 
    txn_lines = [] 
    in_tx_section = False

    markers = {
        "mbna": {
            "start": ["details of your transactions"],
            "stop": ["important notice", "subtotal of activity", "interest information"]
        },
        "cibc": {
            "start": ["transactions from", "your new charges and credits", "your payments"],
            "stop": ["total for", "cibc creditsmart", "total payments"]
        },
        "scotiabank": {
            "start": ["transactions since your last statement", "transactions - continued"],
            "stop": ["interest charges", "sub-total"]
        },
        "default": {
            "start": [], "stop": []
        }
    }

    bank_markers = markers.get(bank_id, markers["default"])

    for line in lines:
        line_lower = line.strip().lower()

        if bank_markers["start"] and any(sm in line_lower for sm in bank_markers["start"]):
            in_tx_section = True
            continue

        if in_tx_section and bank_markers["stop"] and any(em in line_lower for em in bank_markers["stop"]):
            in_tx_section = False
            continue

        is_active = in_tx_section if bank_markers["start"] else True

        if is_active:
            line_clean = line.strip()
            if re.search(r'\d{2}/\d{2}/\d{2,4}.*\$\d+', line_clean): 
                txn_lines.append(line_clean) 
            elif re.search(r'\w{3} \d{2}\s+\w{3} \d{2}', line_clean): 
                txn_lines.append(line_clean) 
            elif re.search(r'\w{3} \d{1,2}.*\d+\.\d{2}', line_clean) and not re.search(r'\w{3} \d{2}\s+\w{3} \d{2}', line_clean):
                txn_lines.append(line_clean)
                
    return txn_lines

def parse_transaction_line(line: str, system_prompt: str) -> Dict:
    full_prompt = f"{system_prompt}\n\nInput:\n{line}\n\nOutput:\n"

    result = subprocess.run(
        ["ollama", "run", MODEL_NAME],
        input=full_prompt,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )

    output = result.stdout.strip()
    cleaned = _clean_llm_output(output)

    try:
        data = json.loads(cleaned)
        raw_amount = str(data.get("amount", "0"))
        raw_amount = re.sub(r"[^\d\.-]", "", raw_amount) 
        data["amount"] = float(raw_amount) if raw_amount else 0.0
    except json.JSONDecodeError as e:
        raise ValueError(f"LLM returned invalid JSON:\n{output}") from e

    return data

def parse_text_to_transactions(text: str, statement_id: int) -> List[Dict]:
    extracted_statement_date = extract_statement_date(text)
    
    bank_id = detect_bank(text)
    
    # We no longer inject dynamic_rules because our Python fuzzy-matcher handles it!
    base_prompt = load_bank_prompt(bank_id)
    
    # Enforce strict JSON output to prevent the LLM from writing markdown or scripts
    system_prompt = f"{base_prompt}\n\nCRITICAL RULE: You must output strictly valid JSON. Do NOT output Python code, scripts, or markdown formatting (like ```json)."

    lines = extract_transaction_lines(text, bank_id)
    transactions = []
    
    for line in lines:
        try:
            txn = parse_transaction_line(line, system_prompt)
            txn["date"] = normalize_transaction_date(txn.get("date", ""), statement_date=extracted_statement_date)
            transactions.append(txn)
        except Exception as e:
            logger.error(f"Skipped parsing line due to error: {line} | Error: {e}")
            continue 

    # ---> NEW: Intercept and apply historical rules BEFORE category resolution <---
    transactions = auto_apply_historical_rules(transactions)

    # FIX 1: Prevent LLM from hallucinating new categories!
    for txn in transactions:
        # If our Python fuzzy-matcher found a historical match, keep it!
        if txn.get("category_id"):
            continue 
            
        # If no historical match was found, STRIP OUT the LLM's guesses.
        # This forces the transaction to go to your Triage UI for manual review.
        txn["category_id"] = None
        txn["category"] = None
        txn["vendor_normalized"] = None
            
    # FIX 2: Use a single connection and ensure it closes perfectly using try/finally
    conn = get_connection()
    try:
        cur = conn.cursor()
        for txn in transactions:
            cur.execute(
                """
                INSERT INTO transactions (statement_id, transaction_date, vendor_raw, vendor_normalized, amount, category_id)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    statement_id, 
                    txn.get("date"), 
                    txn.get("vendor_raw"), 
                    txn.get("vendor_normalized"), 
                    txn.get("amount"), 
                    txn.get("category_id")
                )
            )
        conn.commit()
    finally:
        # This guarantees the lock is released, allowing update_statement_status to run
        conn.close()

    return transactions


def _clean_llm_output(text: str) -> str: 
    text = text.replace("```json", "").replace("```", "").strip()
    match = re.search(r"\{.*?\}", text, re.DOTALL) 
    if not match: 
        raise ValueError("No JSON object found in LLM output") 
    return match.group(0)

def normalize_transaction_date(txn_date_str: str, statement_date: str) -> str:
    """
    Normalizes LLM date strings into YYYY-MM-DD.
    Intelligently infers missing years from the statement date and handles December-to-January rollovers.
    """
    if not txn_date_str or str(txn_date_str).lower() == "null":
        return None

    txn_date_str = str(txn_date_str).strip()

    # --- 1. Extract context from the Statement Date ---
    # Default to current year/month just in case the statement date is missing
    stmt_year = datetime.now().year
    stmt_month = datetime.now().month

    if statement_date:
        # Look for 4-digit year in statement date (e.g. 2024, 2025, 2026)
        year_match = re.search(r'\b(20\d{2})\b', str(statement_date))
        if year_match:
            stmt_year = int(year_match.group(1))

        # Look for Month in statement date
        month_match = re.search(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b', str(statement_date), re.IGNORECASE)
        if month_match:
            months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
            stmt_month = months.index(month_match.group(1).lower()[:3]) + 1
        else:
            # Fallback: check if statement date is MM/DD/YYYY
            m_num = re.search(r'\b(\d{1,2})[-/]\d{1,2}[-/]20\d{2}\b', str(statement_date))
            if m_num:
                stmt_month = int(m_num.group(1))

    # --- 2. Extract context from the Transaction Date ---
    txn_year = stmt_year
    txn_month = 1
    txn_day = 1

    # Check if the transaction string ALREADY contains an explicit year
    has_explicit_year = bool(re.search(r'\b(20\d{2})\b', txn_date_str))
    if has_explicit_year:
        txn_year = int(re.search(r'\b(20\d{2})\b', txn_date_str).group(1))

    # Extract Month from transaction
    txn_month_match = re.search(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b', txn_date_str, re.IGNORECASE)
    if txn_month_match:
        months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
        txn_month = months.index(txn_month_match.group(1).lower()[:3]) + 1
    else:
        # Fallback for formats like "10/01" or "2025-10-01"
        num_match = re.search(r'\b(\d{1,2})[-/.](\d{1,2})\b', txn_date_str)
        if num_match:
            # Standard assumption: MM/DD
            txn_month = int(num_match.group(1))
            if has_explicit_year and txn_date_str.startswith(str(txn_year)):
                # Handle YYYY-MM-DD
                iso_match = re.search(r'20\d{2}[-/.](\d{1,2})[-/.](\d{1,2})', txn_date_str)
                if iso_match:
                    txn_month = int(iso_match.group(1))

    # Extract Day from transaction
    # Remove the year so we don't accidentally match "20" from "2025" as a day
    date_no_year = re.sub(r'\b20\d{2}\b', '', txn_date_str)
    day_match = re.search(r'\b([1-9]|[12]\d|3[01])\b', date_no_year)
    if day_match:
        txn_day = int(day_match.group(1))

    # --- 3. Apply the Year-Rollover Logic ---
    if not has_explicit_year:
        # If the transaction month is STRICTLY GREATER than the statement month
        # (e.g. Statement is Feb, Transaction is Dec), it occurred in the previous year.
        if txn_month > stmt_month:
            txn_year -= 1

    # --- 4. Format securely ---
    try:
        # Validates the date is real (e.g. not Feb 31)
        final_date = datetime(txn_year, txn_month, txn_day)
        return final_date.strftime("%Y-%m-%d")
    except ValueError:
        # If datetime throws an error (e.g. Feb 29 on non-leap year), fallback safely
        return f"{txn_year:04d}-{txn_month:02d}-{txn_day:02d}"

def extract_statement_date(extracted_text: str) -> Optional[str]:
    MONTH_PATTERN = (
        r"(January|February|March|April|May|June|July|August|September|October|November|December|"
        r"Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"
    )
    text = extracted_text.replace("\n", " ")

    statement_date_patterns = [
        rf"Statement Date[:\s]+({MONTH_PATTERN}\s+\d{{1,2}},\s+\d{{4}})",
        rf"Statement date[:\s]+({MONTH_PATTERN}\s+\d{{1,2}},\s+\d{{4}})",
    ]

    for pattern in statement_date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return _to_iso(match.group(1))

    range_patterns = [
        rf"Statement Period[:\s]+.*?\b-\b\s*({MONTH_PATTERN}\s+\d{{1,2}},\s+\d{{4}})",
        rf"Billing Cycle[:\s]+.*?\b-\b\s*({MONTH_PATTERN}\s+\d{{1,2}},\s+\d{{4}})",
    ]

    for pattern in range_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return _to_iso(match.group(1))

    return None

def auto_apply_historical_rules(transactions: List[Dict]) -> List[Dict]:
    """
    Intercepts transactions and forces historical user categorizations 
    to override the LLM using exact, fuzzy, and prefix matching.
    """
    history = get_historical_vendor_mappings()
    if not history:
        return transactions
        
    # Build lookup dictionaries for lightning-fast matching
    raw_to_mapping = {str(h["vendor_raw"]).lower().strip(): h for h in history if h.get("vendor_raw")}
    known_raws = list(raw_to_mapping.keys())
    
    # NEW: Build prefix lookups (isolate the first 12 characters)
    PREFIX_LEN = 12
    prefix_to_raw = {}
    for k in known_raws:
        prefix = k[:PREFIX_LEN]
        # Keep the first mapping we find for this prefix
        if prefix not in prefix_to_raw:
            prefix_to_raw[prefix] = k
            
    known_prefixes = list(prefix_to_raw.keys())
    
    for txn in transactions:
        current_raw = str(txn.get("vendor_raw", "")).lower().strip()
        if not current_raw:
            continue
            
        matched_mapping = None
        
        # 1. Try an Exact Match first
        if current_raw in raw_to_mapping:
            matched_mapping = raw_to_mapping[current_raw]
        else:
            # 2. Try a Full Fuzzy Match (80% similarity threshold)
            matches = difflib.get_close_matches(current_raw, known_raws, n=1, cutoff=0.8)
            if matches:
                matched_mapping = raw_to_mapping[matches[0]]
            else:
                # 3. Try Exact Prefix Match (First 12 characters)
                # Perfect for "STARBUCKS #123" vs "STARBUCKS #999"
                current_prefix = current_raw[:PREFIX_LEN]
                if current_prefix in prefix_to_raw:
                    matched_mapping = raw_to_mapping[prefix_to_raw[current_prefix]]
                elif len(current_prefix) >= 5:
                    # 4. Try Fuzzy Prefix Match (80% similarity on the first 12 characters)
                    # Restricted to lengths >= 5 to prevent short acronyms from falsely matching
                    prefix_matches = difflib.get_close_matches(current_prefix, known_prefixes, n=1, cutoff=0.8)
                    if prefix_matches:
                        matched_mapping = raw_to_mapping[prefix_to_raw[prefix_matches[0]]]
        
        # If we found a historical match, aggressively override the LLM!
        if matched_mapping:
            txn["vendor_normalized"] = matched_mapping["vendor_normalized"]
            txn["category_id"] = matched_mapping["category_id"]
            
    return transactions

def _to_iso(date_str: str) -> str:
    date_str = date_str.strip()
    for fmt in ("%B %d, %Y", "%b %d, %Y"):
        try:
            return datetime.strptime(date_str, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    raise ValueError(f"Unrecognized date format: {date_str}")