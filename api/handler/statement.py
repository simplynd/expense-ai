from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from pathlib import Path
import shutil
import uuid
from typing import List, Optional

from pydantic import BaseModel
from api.db.db import (
    create_statement,
    update_statement_status,
    get_statements,
    get_transactions_for_statement,
    insert_transactions,
)
from api.tool.pdf import extract_text_from_pdf
from api.tool.transactions import parse_text_to_transactions
from api.tool.logging_config import logger

router = APIRouter()

UPLOAD_DIR = Path("data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# =========================
# Pydantic Models
# =========================
class TransactionOut(BaseModel):
    id: int
    statement_id: int
    transaction_date: Optional[str]
    vendor_raw: str
    vendor_normalized: Optional[str]
    amount: Optional[float]
    category: Optional[str]


class StatementOut(BaseModel):
    id: int
    filename: str
    file_size: int
    status: str
    uploaded_at: str
    processed_at: Optional[str]
    error_message: Optional[str]
    transactions: Optional[List[TransactionOut]] = []


class UploadResponse(BaseModel):
    message: str
    statement_id: int
    status: str

# ==============================================================================================================================================
# Background Job
# ==============================================================================================================================================

def process_statement_async(statement_id: int, pdf_path: Path):
    """
    Background job:
    - Extract text
    - Parse transactions
    - Save transactions
    - Update statement status
    """
    try:
        text = extract_text_from_pdf(pdf_path)
        transactions = parse_text_to_transactions(text, statement_id)

        # TODO (next step):
        # save_transactions(statement_id, transactions)

        update_statement_status(statement_id, "completed")
        logger.info(f" Statement {statement_id} processing completed:")

    except Exception as e:
        update_statement_status(statement_id, "failed")
        logger.info(f"❌ Statement {statement_id} failed:", e)

    finally:
        # Cleanup uploaded file
        if pdf_path.exists():
            pdf_path.unlink()


# ==============================================================================================================================================
# Endpoints
# ==============================================================================================================================================

@router.post("/upload", response_model=UploadResponse)
async def upload_statement(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """
    Upload a PDF statement for processing.
    Returns immediately with processing status. Transactions are parsed asynchronously.
    """

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    file_id = uuid.uuid4().hex
    pdf_path = UPLOAD_DIR / f"{file_id}.pdf"

    # Save file temporarily
    with open(pdf_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Create DB record
    statement_id = create_statement(
        filename=file.filename,
        file_size=pdf_path.stat().st_size,
        status="processing",
    )

    # Start async processing
    background_tasks.add_task(
        process_statement_async,
        statement_id,
        pdf_path,
    )

    return UploadResponse(
        message="Statement uploaded successfully",
        statement_id=statement_id,
        status="processing",
    )


@router.get("/", response_model=List[StatementOut])
def list_statements() -> List[StatementOut]:
    """
    List all uploaded statements with status, processed date, and error messages.
    """
    statements = get_statements()
    return [StatementOut(**s) for s in statements]


@router.get("/{statement_id}", response_model=StatementOut)
def get_statement(statement_id: int) -> StatementOut:
    """
    Get details of a single statement including all transactions.
    """
    statements = get_statements()
    stmt = next((s for s in statements if s["id"] == statement_id), None)
    if not stmt:
        raise HTTPException(status_code=404, detail="Statement not found")

    transactions = get_transactions_for_statement(statement_id)
    stmt["transactions"] = transactions
    return StatementOut(**stmt)