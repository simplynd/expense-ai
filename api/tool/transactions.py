import re
import json
import subprocess
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
from collections import defaultdict

from db.db import get_connection, get_or_create_category
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
    
    # Inject dynamic user rules directly into the LLM prompt
    base_prompt = load_bank_prompt(bank_id)
    dynamic_rules = get_dynamic_rules_prompt()
    system_prompt = f"{base_prompt}\n{dynamic_rules}"

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
            
    conn = get_connection()
    cur = conn.cursor()

    for txn in transactions:
        # Resolve category ID if the LLM provided a category string
        cat_name = txn.get("category")
        cat_id = None
        if cat_name and cat_name.lower() != "null":
            cat_id = get_or_create_category(cat_name)

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
                cat_id
            )
        )

    conn.commit()
    conn.close()

    return transactions

def _clean_llm_output(text: str) -> str: 
    text = text.replace("```json", "").replace("```", "").strip()
    match = re.search(r"\{.*?\}", text, re.DOTALL) 
    if not match: 
        raise ValueError("No JSON object found in LLM output") 
    return match.group(0)

def normalize_transaction_date(date_str: str, statement_date: str) -> str:
    try:
        dt = datetime.strptime(date_str, "%m/%d/%Y")
        return dt.strftime("%Y-%m-%d")
    except ValueError:
        pass
    try:
        dt = datetime.strptime(date_str, "%m/%d/%y")
        return dt.strftime("%Y-%m-%d")
    except ValueError:
        pass
    try:
        dt = datetime.strptime(date_str, "%b %d")
        if statement_date:
            stmt_dt = datetime.strptime(statement_date, "%Y-%m-%d")  
            year = stmt_dt.year
            if dt.month > stmt_dt.month:
                year -= 1
        else:
            year = datetime.now().year
        dt = dt.replace(year=year)
        return dt.strftime("%Y-%m-%d")
    except ValueError:
        pass
    return date_str

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

def _to_iso(date_str: str) -> str:
    date_str = date_str.strip()
    for fmt in ("%B %d, %Y", "%b %d, %Y"):
        try:
            return datetime.strptime(date_str, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    raise ValueError(f"Unrecognized date format: {date_str}")