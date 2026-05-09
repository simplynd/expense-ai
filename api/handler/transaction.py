from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from db.db import (
    get_transactions_for_statement,
    assign_category_to_transactions,
    get_categories,
    get_or_create_category,
    insert_manual_transaction,
    update_manual_transaction,
    delete_transaction,
    is_manual_transaction,
    get_transaction_by_id,
    get_unnormalized_transactions,
    apply_normalization_to_transactions,
    update_category_name,
    delete_category,
    get_all_transactions
)

router = APIRouter()

# =========================
# Pydantic Models
# =========================

class TransactionCategoryAssign(BaseModel):
    transaction_ids: List[int]
    category_name: str

class CategoryOut(BaseModel):
    id: int
    name: str
    parent_id: Optional[int] = None

class CategoryUpdate(BaseModel):
    name: str

class TransactionOut(BaseModel):
    id: int
    statement_id: int
    transaction_date: Optional[str]
    vendor_raw: str
    vendor_normalized: Optional[str]
    amount: Optional[float]
    category: Optional[str]

class ManualTransactionCreate(BaseModel):
    statement_id: int
    transaction_date: str
    vendor_raw: str
    amount: float
    category: Optional[str] = None

class ManualTransactionUpdate(BaseModel):
    transaction_date: Optional[str] = None
    vendor_raw: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None

class BatchNormalizeRequest(BaseModel):
    transaction_ids: List[int]
    normalized_vendor: str
    category_id: Optional[int] = None

# =========================
# Review & Normalization Endpoints
# =========================

@router.get("/review/unnormalized", response_model=List[Dict[str, Any]])
def get_unnormalized_transactions_endpoint():
    """
    Returns all transactions that require manual vendor normalization.
    """
    return get_unnormalized_transactions()

@router.post("/review/normalize")
def batch_normalize_transactions(payload: BatchNormalizeRequest):
    """
    Apply a user's manual normalization to a batch of transactions
    and save the mapping rule.
    """
    if not payload.transaction_ids:
        raise HTTPException(status_code=400, detail="No transactions selected.")
        
    apply_normalization_to_transactions(
        transaction_ids=payload.transaction_ids,
        normalized_vendor=payload.normalized_vendor,
        category_id=payload.category_id
    )
    return {"message": "Successfully updated transactions and saved mapping rule."}

# =========================
# Existing Endpoints 
# =========================

@router.get("/statement/{statement_id}/transactions", response_model=List[TransactionOut])
def list_transactions(statement_id: int):
    transactions = get_transactions_for_statement(statement_id)
    return [TransactionOut(**tx) for tx in transactions]

@router.post("/assign-category", response_model=dict)
def assign_category(payload: TransactionCategoryAssign):
    category_id = get_or_create_category(payload.category_name)
    assign_category_to_transactions(payload.transaction_ids, category_id)
    return {"message": f"Assigned category '{payload.category_name}'"}

@router.get("/categories", response_model=List[CategoryOut])
def list_categories():
    categories = get_categories()
    return [CategoryOut(**c) for c in categories]

@router.post("/categories", response_model=CategoryOut)
def create_category(name: str, parent_id: Optional[int] = None):
    category_id = get_or_create_category(name, parent_id)
    return CategoryOut(id=category_id, name=name, parent_id=parent_id)

@router.put("/categories/{category_id}")
def update_category_endpoint(category_id: int, payload: CategoryUpdate):
    """Rename a category."""
    update_category_name(category_id, payload.name)
    return {"message": "Category renamed successfully"}

@router.delete("/categories/{category_id}", status_code=204)
def delete_category_endpoint(category_id: int):
    """Delete a category safely."""
    try:
        delete_category(category_id)
    except ValueError as e:
        # If it's in use, throw a 400 Bad Request to alert the frontend
        raise HTTPException(status_code=400, detail=str(e))

# =========================
# Manual Transaction Endpoints
# =========================

@router.post("/manual", response_model=TransactionOut, status_code=201)
def create_manual_transaction_endpoint(payload: ManualTransactionCreate):
    """
    Create a manual transaction under a manual statement.
    """
    category_id = None
    if payload.category:
        category_id = get_or_create_category(payload.category)
    
    # FIX: Since the user is typing this manually, the raw input IS the normalized input.
    # No more tuple binding errors from the vendor tool!
    normalized_vendor = payload.vendor_raw
    
    try:
        transaction_id  = insert_manual_transaction(
            statement_id=payload.statement_id,
            transaction_date=payload.transaction_date,
            vendor_raw=payload.vendor_raw,
            vendor_normalized=normalized_vendor,
            amount=payload.amount,
            category_id=category_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    tx = get_transaction_by_id(transaction_id)
    if not tx:
        raise HTTPException(status_code=500, detail="Transaction creation failed")

    return TransactionOut(**tx)

@router.put("/{transaction_id}", response_model=TransactionOut)
def update_manual_transaction_endpoint(transaction_id: int, payload: ManualTransactionUpdate):
    if not is_manual_transaction(transaction_id):
        raise HTTPException(status_code=403, detail="Only transactions from manual statements can be edited")

    updates = {k: v for k, v in payload.dict(exclude_unset=True).items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    try:
        update_manual_transaction(transaction_id=transaction_id, updates=updates)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    tx = get_transaction_by_id(transaction_id)
    return TransactionOut(**tx)

@router.delete("/{transaction_id}", status_code=204)
def delete_transaction_endpoint(transaction_id: int):
    """
    Delete a transaction from the database.
    """
    # Simply call the delete function without the manual source_type check
    delete_transaction(transaction_id)

@router.get("/all", response_model=List[TransactionOut])
def list_all_transactions_endpoint():
    """Returns every transaction in the database."""
    transactions = get_all_transactions()
    return [TransactionOut(**tx) for tx in transactions]