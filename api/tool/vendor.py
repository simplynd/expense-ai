from rapidfuzz import process, fuzz
from db.db import get_vendor_mappings
from typing import Tuple, Optional

def normalize_vendor(raw_vendor: str) -> Tuple[Optional[str], Optional[int]]:
    """
    Attempts to normalize a vendor and assign a category using user-defined mappings.
    Uses a Two-Pass approach to handle complex banking transaction hashes.
    """
    raw_vendor = raw_vendor.strip()
    mappings = get_vendor_mappings()
    
    if not mappings:
        return None, None
        
    raw_lower = raw_vendor.lower()
    
    # ==========================================
    # PASS 1: Explicit Substring Matching
    # ==========================================
    # If the user previously created a clean name like "Amazon", and that 
    # exact word appears in the new raw string, match it instantly.
    
    clean_to_data = {}
    for m in mappings:
        clean_name = m.get("normalized_vendor")
        # Require at least 4 characters to prevent short generic strings from aggressively over-matching
        if clean_name and len(clean_name) >= 4: 
            if clean_name not in clean_to_data:
                clean_to_data[clean_name] = m
                
    for clean_name, mapped_data in clean_to_data.items():
        if clean_name.lower() in raw_lower:
            return mapped_data["normalized_vendor"], mapped_data["category_id"]

    # ==========================================
    # PASS 2: Forgiving Fuzzy String Matching
    # ==========================================
    # If the user mapped a cryptic string (e.g., "AMZN Mktp" -> "Amazon"), Pass 1 fails.
    # We compare the new raw string against all saved raw string rules.
    
    choices = [m["raw_vendor"] for m in mappings]
    mapping_dict = {m["raw_vendor"]: m for m in mappings}
    
    # token_set_ratio ignores word order and duplicates
    result = process.extractOne(raw_vendor, choices, scorer=fuzz.token_set_ratio)
    
    if result:
        matched_string, score, _ = result
        # Lowered threshold to 70.0 to accommodate changing transaction hashes (like *B80JR8VW0)
        if score >= 70.0: 
            mapped_data = mapping_dict[matched_string]
            return mapped_data["normalized_vendor"], mapped_data["category_id"]
            
    # If both passes fail, return None so it gets flagged in the UI for review
    return None, None