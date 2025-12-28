from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel

from db.db import (
    get_transactions_for_statement,
    assign_category_to_transactions,
    get_categories,
    get_or_create_category,
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


class TransactionOut(BaseModel):
    id: int
    statement_id: int
    transaction_date: Optional[str]
    vendor_raw: str
    vendor_normalized: Optional[str]
    amount: Optional[float]
    category: Optional[str]


# =========================
# Endpoints
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
    return {"message": f"Assigned category '{payload.category_name}' to transactions successfully"}


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
