from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from db.db import get_all_income_records, save_yearly_income, delete_yearly_income

router = APIRouter()

class PersonIncome(BaseModel):
    person_name: str
    gross_income: float
    net_income: float

class YearlyIncomePayload(BaseModel):
    year: str
    records: List[PersonIncome]

@router.get("/")
def list_income():
    return get_all_income_records()

@router.post("/")
def save_income(payload: YearlyIncomePayload):
    save_yearly_income(payload.year, [r.model_dump() for r in payload.records])
    return {"status": "success"}

@router.delete("/{year}")
def delete_income(year: str):
    """Deletes all NOA records for a given year."""
    delete_yearly_income(year)
    return {"status": "success"}