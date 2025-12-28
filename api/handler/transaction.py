from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel

from db.db import (
    get_transactions_for_statement,
    assign_category_to_transactions,
    get_categories,
    get_or_create_category,
    insert_manual_transaction,
    update_manual_transaction,
    delete_manual_transaction,
    is_manual_transaction,
)

from tool.vendor import normalize_vendor

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


# =========================
# Existing Endpoints (UNCHANGED)
# =========================

@router.get("/statement/{statement_id}/transactions", response_model=List[TransactionOut])
def list_transactions(statement_id: int):
    """
    List all transactions for a given statement.
    """
    transactions = get_transactions_for_statement(statement_id)
    return [TransactionOut(**tx) for tx in transactions]


@router.post("/assign-category", response_model=dict)
def assign_category(payload: TransactionCategoryAssign):
    """
    Assign a category to one or more transactions.
    If the category does not exist, it will be created automatically.
    """
    category_id = get_or_create_category(payload.category_name)
    assign_category_to_transactions(payload.transaction_ids, category_id)
    return {
        "message": f"Assigned category '{payload.category_name}' to transactions successfully"
    }


@router.get("/categories", response_model=List[CategoryOut])
def list_categories():
    """
    List all available categories.
    """
    categories = get_categories()
    return [CategoryOut(**c) for c in categories]


@router.post("/categories", response_model=CategoryOut)
def create_category(name: str, parent_id: Optional[int] = None):
    """
    Create a new category. If category exists, returns the existing category.
    """
    category_id = get_or_create_category(name, parent_id)
    return CategoryOut(id=category_id, name=name, parent_id=parent_id)


# =========================
# NEW: Manual Transaction Endpoints
# =========================

@router.post("/manual", response_model=TransactionOut, status_code=201)
def create_manual_transaction_endpoint(payload: ManualTransactionCreate):
    """
    Create a manual transaction under a manual statement.
    """

    category_id = None
    if payload.category:
        category_id = get_or_create_category(payload.category)
    
    normalized_vendor = payload.vendor_raw
    try:
        normalized_vendor = normalize_vendor(payload.vendor_raw)
    except Exception as e:
        pass

    tx = insert_manual_transaction(
        statement_id=payload.statement_id,
        transaction_date=payload.transaction_date,
        vendor_raw=payload.vendor_raw,
        amount=payload.amount,
        category_id=category_id,
    )

    return TransactionOut(**tx)


@router.put("/{transaction_id}", response_model=TransactionOut)
def update_manual_transaction_endpoint(
    transaction_id: int,
    payload: ManualTransactionUpdate,
):
    """
    Update a manual transaction.
    Only allowed for transactions belonging to manual statements.
    """

    if not is_manual_transaction(transaction_id):
        raise HTTPException(
            status_code=403,
            detail="Only transactions from manual statements can be edited",
        )

    category_id = None
    if payload.category:
        category_id = get_or_create_category(payload.category)

    tx = update_manual_transaction(
        transaction_id=transaction_id,
        transaction_date=payload.transaction_date,
        vendor_raw=payload.vendor_raw,
        amount=payload.amount,
        category_id=category_id,
    )

    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    return TransactionOut(**tx)


@router.delete("/{transaction_id}", status_code=204)
def delete_manual_transaction_endpoint(transaction_id: int):
    """
    Delete a manual transaction.
    Only allowed for transactions belonging to manual statements.
    """

    if not is_manual_transaction(transaction_id):
        raise HTTPException(
            status_code=403,
            detail="Only transactions from manual statements can be deleted",
        )

    deleted = delete_manual_transaction(transaction_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Transaction not found")
