from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from pathlib import Path
import shutil
import uuid

from api.db.db import (
    create_statement,
    update_statement_status,
)
from api.tool.pdf import extract_text_from_pdf
from api.tool.transactions import parse_text_to_transactions

router = APIRouter()

UPLOAD_DIR = Path("data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


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
        print(f" Statement {statement_id} processing completed:")

    except Exception as e:
        update_statement_status(statement_id, "failed")
        print(f"❌ Statement {statement_id} failed:", e)

    finally:
        # Cleanup uploaded file
        if pdf_path.exists():
            pdf_path.unlink()


@router.post("/upload")
async def upload_statement(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
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

    return {
        "message": "Statement uploaded successfully",
        "statement_id": statement_id,
        "status": "processing",
    }
