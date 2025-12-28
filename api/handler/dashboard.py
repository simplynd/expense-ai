from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
from collections import defaultdict

from db.db import get_transactions_for_statement, get_statements

router = APIRouter()


# =========================
# Response Models
# =========================

class MonthlyExpenses(BaseModel):
    month: int
    expense: float


class DashboardSummaryResponse(BaseModel):
    total_expense: float
    highest_expense_month: Optional[int]
    monthly_expenses: List[MonthlyExpenses]


class TransactionResponse(BaseModel):
    id: int
    statement_id: int
    transaction_date: str
    vendor_raw: str
    vendor_normalized: Optional[str]
    amount: float
    category: Optional[str]


# =========================
# Endpoints
# =========================

@router.get("/summary", response_model=DashboardSummaryResponse)
def dashboard_summary(year: Optional[int] = None):
    """
    Returns total expense, highest expense month, and monthly breakdown for a given year.
    Defaults to current year if not provided.
    """
    if year is None:
        year = datetime.now().year

    monthly_expenses_dict = defaultdict(float)
    total_expense = 0.0

    statements = get_statements()
    for stmt in statements:
        transactions = get_transactions_for_statement(stmt["id"])
        for tx in transactions:
            try:
                if tx["transaction_date"]:
                    tx_date = datetime.strptime(tx["transaction_date"], "%Y-%m-%d")
                    if tx_date.year == year:
                        amount = tx.get("amount") or 0
                        total_expense += amount
                        monthly_expenses_dict[tx_date.month] += amount
            except Exception:
                continue

    if not monthly_expenses_dict:
        return DashboardSummaryResponse(
            total_expense=0.0,
            highest_expense_month=None,
            monthly_expenses=[]
        )

    highest_month = max(monthly_expenses_dict.items(), key=lambda x: x[1])[0]
    monthly_expenses = [MonthlyExpenses(month=m, expense=e) for m, e in sorted(monthly_expenses_dict.items())]

    return DashboardSummaryResponse(
        total_expense=total_expense,
        highest_expense_month=highest_month,
        monthly_expenses=monthly_expenses
    )


@router.get("/transactions/{year}/{month}", response_model=List[TransactionResponse])
def transactions_by_month(year: int, month: int):
    """
    Returns all transactions for the specified month and year, ordered by date ascending.
    """
    if not (1 <= month <= 12):
        raise HTTPException(status_code=400, detail="Month must be between 1 and 12")

    result = []
    statements = get_statements()
    for stmt in statements:
        transactions = get_transactions_for_statement(stmt["id"])
        for tx in transactions:
            try:
                if tx["transaction_date"]:
                    tx_date = datetime.strptime(tx["transaction_date"], "%Y-%m-%d")
                    if tx_date.year == year and tx_date.month == month:
                        result.append(tx)
            except Exception:
                continue

    if not result:
        raise HTTPException(status_code=404, detail=f"No transactions found for {year}-{month:02d}")

    result.sort(key=lambda x: x["transaction_date"])
    return result