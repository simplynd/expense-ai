import re
import json
import subprocess
from typing import List, Dict

from api.tool.vendor import normalize_vendor
from api.db.db import get_connection

MODEL_NAME = "mistral-small3.2:latest"

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

def normalize_transaction_vendors(transactions: list) -> list:
    """Add normalized vendor field to each transaction"""
    for txn in transactions:
        txn["vendor"] = normalize_vendor(txn["vendor_raw"])
    return transactions


def parse_text_to_transactions(text: str, statement_id: int) -> List[Dict]:
    """
    Full pipeline:
    - extract candidate transaction lines
    - parse each line using the LLM
    """
    lines = extract_transaction_lines(text)
    transactions = [parse_transaction_line(line) for line in lines]
    transactions = normalize_transaction_vendors(transactions)

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
