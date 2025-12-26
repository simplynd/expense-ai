import re
import json
import subprocess
from typing import List, Dict, Optional
from datetime import datetime

from api.tool.vendor import normalize_vendor
from api.db.db import get_connection
from api.tool.logging_config import logger

MODEL_NAME = "mistral-small3.2:latest"

def extract_transaction_lines(text: str) -> List[str]:
    """
    Extract candidate transaction lines from raw statement text.
    Heuristic-based only; parsing is delegated to the LLM.
    """
    lines = text.splitlines() # Simple heuristic: line contains date + amount 
    txn_lines = [] 
    for line in lines: 
        if re.search(r'\d{2}/\d{2}/\d{2,4}.*\$\d+', line): 
            txn_lines.append(line.strip()) 
        elif re.search(r'\w{3} \d{2} \w{3} \d{2}', line): 
            txn_lines.append(line.strip()) 
    
    return txn_lines


def parse_transaction_line(line: str) -> Dict:
    """ 
    Parse a single transaction line with dual-date format. 
    Example: Nov 20 Nov 24 FRESHCO #9888 BRAMPTON ON Retail and Grocery 23.87 
    """

    PROMPT_TEMPLATE = """
        You are a data extraction engine.

        Given a single bank transaction line, extract the following fields:

        - date: the transaction date ONLY
        - vendor_raw: the full vendor name and description
        - amount: transaction amount as a number

        Rules:
        - If the line contains two dates, the FIRST date is the transaction date.
        - Ignore the posted date.
        - Do not invent or normalize vendor names.
        - Preserve original spelling in vendor_raw.
        - Output MUST be valid JSON.
        - Do NOT include explanations, markdown, or extra text.

        Input:
        {line}

        Output:
        """

    prompt = PROMPT_TEMPLATE.format(line=line.strip())

    result = subprocess.run(
        ["ollama", "run", MODEL_NAME],
        input=prompt,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )

    output = result.stdout.strip()
    cleaned = _clean_llm_output(output)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(f"LLM returned invalid JSON:\n{output}") from e

    return data

def normalize_transaction_vendors(transactions: list, extracted_statement_date: str) -> list:
    """Add normalized vendor field to each transaction"""
    for txn in transactions:
        txn["vendor"] = normalize_vendor(txn["vendor_raw"])
        txn["date"] = normalize_transaction_date(txn["date"], statement_date=extracted_statement_date)
    return transactions


def parse_text_to_transactions(text: str, statement_id: int) -> List[Dict]:
    """
    Full pipeline:
    - extract candidate transaction lines
    - parse each line using the LLM
    """
    extracted_statement_date = extract_statement_date(text)
    logger.info("Extracted Statement Date : {}".format(extracted_statement_date))
    lines = extract_transaction_lines(text)
    transactions = [parse_transaction_line(line) for line in lines]
    transactions = normalize_transaction_vendors(transactions, extracted_statement_date)

    conn = get_connection()
    cur = conn.cursor()

    for txn in transactions:
        cur.execute(
            """
            INSERT INTO transactions (statement_id, transaction_date, vendor_raw, vendor_normalized, amount)
            VALUES (?, ?, ?, ?, ?)
            """,
            (statement_id, txn["date"], txn["vendor_raw"], txn["vendor"], txn["amount"])
        )

    conn.commit()
    conn.close()

    return transactions


def _clean_llm_output(text: str) -> str: 
    """
    Extract the first JSON object from LLM output.
    Handles:
    - markdown fences
    - explanations before/after JSON
    """
    # Remove markdown fences if present 
    text = re.sub(r"(?:json)?", "", text)
    text = text.replace("", "").strip() 
    
    # Find first {...} block 
    match = re.search(r"\{.*?\}", text, re.DOTALL) 
    if not match: 
        raise ValueError("No JSON object found in LLM output") 
    return match.group(0)


def normalize_transaction_date(date_str: str, statement_date: str) -> str:
    """
    Normalize transaction date to YYYY-MM-DD format.

    Args:
        date_str (str): Date string from transaction (e.g., "Nov 23", "11/24/2025")
        statement_date (str): Optional statement date (e.g., "Jan 10, 2026") to infer year

    Returns:
        str: Normalized date string in YYYY-MM-DD format
    """
    # Try to parse standard MM/DD/YYYY
    try:
        dt = datetime.strptime(date_str, "%m/%d/%Y")
        # logger.info("1. dt : {}".format(dt))
        return dt.strftime("%Y-%m-%d")
    except ValueError:
        pass

    # Try to parse MM/DD/YY
    try:
        dt = datetime.strptime(date_str, "%m/%d/%y")
        # logger.info("2. dt : {}".format(dt))
        return dt.strftime("%Y-%m-%d")
    except ValueError:
        pass

    # Try to parse Month DD (e.g., "Nov 23") and infer year
    try:
        dt = datetime.strptime(date_str, "%b %d")
        # logger.info("3. dt : {}".format(dt))
        # logger.info("statement_date : {}".format(statement_date))
        if statement_date:
            # Infer year from statement date
            stmt_dt = datetime.strptime(statement_date, "%Y-%m-%d")  # e.g., "Jan 10, 2026"
            # logger.info("Stmt_dt : {}".format(stmt_dt))
            year = stmt_dt.year
            # Handle December transaction in January statement
            if dt.month > stmt_dt.month:
                year -= 1
        else:
            year = datetime.now().year
        dt = dt.replace(year=year)
        return dt.strftime("%Y-%m-%d")
    except ValueError:
        pass

    # If nothing works, return original
    return date_str


def extract_statement_date(extracted_text: str) -> Optional[str]:
    """
    Extract statement end date in YYYY-MM-DD format.
    Regex-based, deterministic, no LLM.
    """

    MONTH_PATTERN = (
        r"(January|February|March|April|May|June|July|August|September|October|November|December|"
        r"Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"
    )

    text = extracted_text.replace("\n", " ")

    # -----------------------------
    # 1. Explicit Statement Date
    # -----------------------------
    statement_date_patterns = [
        rf"Statement Date[:\s]+({MONTH_PATTERN}\s+\d{{1,2}},\s+\d{{4}})",
        rf"Statement date[:\s]+({MONTH_PATTERN}\s+\d{{1,2}},\s+\d{{4}})",
    ]

    for pattern in statement_date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return _to_iso(match.group(1))

    # -----------------------------
    # 2. Statement Period / Billing Cycle (END DATE)
    # -----------------------------
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
    """
    Convert 'September 28, 2025' or 'Sep 28, 2025' → '2025-09-28'
    """
    date_str = date_str.strip()

    for fmt in ("%B %d, %Y", "%b %d, %Y"):
        try:
            return datetime.strptime(date_str, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue

    raise ValueError(f"Unrecognized date format: {date_str}")