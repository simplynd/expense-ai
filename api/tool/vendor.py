import re
import subprocess
from db.db import get_connection

MODEL_NAME = "mistral-small3.2:latest"

# =========================
# Vendor cache operations
# =========================

def get_cached_vendor(raw_vendor: str) -> str | None:
    """
    Look for a vendor in the cache.
    Matches first few characters to handle unique transaction IDs.
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT normalized_vendor FROM vendor_cache WHERE raw_vendor LIKE ?",
        (f"{raw_vendor[:10]}%",)  # Match first 10 characters
    )
    row = cur.fetchone()
    conn.close()
    return row[0] if row else None

def cache_vendor(raw_vendor: str, normalized_vendor: str):
    """
    Cache normalized vendor in the DB.
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT OR REPLACE INTO vendor_cache (raw_vendor, normalized_vendor)
        VALUES (?, ?)
        """,
        (raw_vendor, normalized_vendor),
    )
    conn.commit()
    conn.close()

# =========================
# LLM Prompt
# =========================

PROMPT_TEMPLATE = """You are an entity extraction engine.

Task:
Extract the PRIMARY brand name from a credit card transaction string.

Rules:
- English only
- Brand name only
- No locations
- No domains (.com, .ca)
- No explanations
- Lowercase
- Use hyphens between words
- One short brand name only

Input: {vendor}
Output:
"""

def _call_llm(raw_vendor: str) -> str:
    """
    Call the LLM to normalize vendor name.
    """
    prompt = PROMPT_TEMPLATE.format(vendor=raw_vendor)
    result = subprocess.run(
        ["ollama", "run", MODEL_NAME],
        input=prompt,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return result.stdout.strip()

def _sanitize_output(output: str) -> str:
    """
    Ensure output is single token, lowercase and only letters/hyphens.
    """
    output = output.splitlines()[0]
    output = output.lower().strip()
    output = re.sub(r"[^a-z\-]", "", output)
    return output

def normalize_vendor(raw_vendor: str) -> str:
    """
    Normalize vendor using cache and LLM.
    """
    raw_vendor = raw_vendor.strip()
    cached = get_cached_vendor(raw_vendor)
    if cached:
        return cached

    llm_output = _call_llm(raw_vendor)
    normalized = _sanitize_output(llm_output)
    if not normalized:
        normalized = "unknown-vendor"
    cache_vendor(raw_vendor, normalized)
    return normalized
