from pathlib import Path
import sqlite3
from typing import List, Optional, Dict, Any

# =========================
# Configuration
# =========================

DATA_DIR = Path("data")
DB_PATH = DATA_DIR / "expense_ai.db"
SCHEMA_PATH = DATA_DIR / "schema.sql"


# =========================
# Connection Helpers
# =========================

def get_connection() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    if not SCHEMA_PATH.exists():
        raise FileNotFoundError(f"Schema file not found: {SCHEMA_PATH}")

    conn = get_connection()
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()


# =========================
# Statement Operations
# =========================

def create_statement(
    filename: str,
    file_size: int,
    status: str,
    source_type: str = "pdf",
) -> int:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO statements (filename, file_size, status, source_type)
        VALUES (?, ?, ?, ?)
        """,
        (filename, file_size, status, source_type),
    )
    conn.commit()
    statement_id = cur.lastrowid
    conn.close()
    return statement_id


def create_manual_statement(filename: str) -> int:
    """
    Create a manual statement container.
    Always completed, file_size = 0, source_type = manual.
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO statements (
            filename,
            file_size,
            status,
            source_type,
            processed_at
        )
        VALUES (?, 0, 'completed', 'manual', CURRENT_TIMESTAMP)
        """,
        (filename,),
    )
    conn.commit()
    statement_id = cur.lastrowid
    conn.close()
    return statement_id


def update_statement_status(
    statement_id: int,
    status: str,
    error_message: Optional[str] = None,
):
    conn = get_connection()
    conn.execute(
        """
        UPDATE statements
        SET status = ?, 
            error_message = ?,
            processed_at = CASE 
                WHEN ? IN ('completed', 'failed') THEN CURRENT_TIMESTAMP
                ELSE processed_at
            END
        WHERE id = ?
        """,
        (status, error_message, status, statement_id),
    )
    conn.commit()
    conn.close()


def update_statement_filename(statement_id: int, filename: str):
    conn = get_connection()
    conn.execute(
        """
        UPDATE statements
        SET filename = ?
        WHERE id = ?
        """,
        (filename, statement_id),
    )
    conn.commit()
    conn.close()


def get_statements() -> List[Dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT *
        FROM statements
        ORDER BY uploaded_at DESC
        """
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


# =========================
# Transaction Operations
# =========================

def insert_transactions(
    statement_id: int,
    transactions: List[Dict[str, Any]],
):
    conn = get_connection()
    cur = conn.cursor()

    for tx in transactions:
        cur.execute(
            """
            INSERT INTO transactions (
                statement_id,
                transaction_date,
                vendor_raw,
                vendor_normalized,
                amount
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                statement_id,
                tx["date"],
                tx["vendor_raw"],
                tx.get("vendor"),
                tx["amount"],
            ),
        )

    conn.commit()
    conn.close()


def insert_manual_transaction(
    statement_id: int,
    transaction_date: str,
    vendor_raw: str,
    vendor_normalized: str,
    amount: float,
    category_id: int,
):
    """
    Insert a manual transaction.
    Only allowed for manual statements.
    """
    conn = get_connection()
    cur = conn.cursor()

    stmt = cur.execute(
        "SELECT source_type FROM statements WHERE id = ?",
        (statement_id,),
    ).fetchone()

    if not stmt or stmt["source_type"] != "manual":
        conn.close()
        raise ValueError("Manual transactions must belong to a manual statement")

    # category_id = None
    # if category_name:
    #     category_id = get_or_create_category(category_name)

    cur.execute(
        """
        INSERT INTO transactions (
            statement_id,
            transaction_date,
            vendor_raw,
            vendor_normalized,
            amount,
            category_id
        )
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (statement_id, transaction_date, vendor_raw, vendor_normalized, amount, category_id),
    )

    transaction_id = cur.lastrowid
    conn.commit()
    conn.close()
    return transaction_id


def update_manual_transaction(
    transaction_id: int,
    updates: Dict[str, Any],
):
    """
    Update a manual transaction.
    """
    conn = get_connection()
    cur = conn.cursor()

    row = cur.execute(
        """
        SELECT s.source_type
        FROM transactions t
        JOIN statements s ON t.statement_id = s.id
        WHERE t.id = ?
        """,
        (transaction_id,),
    ).fetchone()

    if not row or row["source_type"] != "manual":
        conn.close()
        raise ValueError("Only manual transactions can be updated")

    fields = []
    values = []

    for key in ("transaction_date", "vendor_raw", "amount"):
        if key in updates:
            fields.append(f"{key} = ?")
            values.append(updates[key])

    if "category" in updates:
        category_id = (
            get_or_create_category(updates["category"])
            if updates["category"]
            else None
        )
        fields.append("category_id = ?")
        values.append(category_id)

    if not fields:
        conn.close()
        return

    values.append(transaction_id)

    cur.execute(
        f"""
        UPDATE transactions
        SET {', '.join(fields)}
        WHERE id = ?
        """,
        values,
    )

    transaction_id = cur.lastrowid
    conn.commit()
    conn.close()
    return transaction_id


def delete_manual_transaction(transaction_id: int):
    """
    Delete a manual transaction.
    """
    conn = get_connection()
    cur = conn.cursor()

    row = cur.execute(
        """
        SELECT s.source_type
        FROM transactions t
        JOIN statements s ON t.statement_id = s.id
        WHERE t.id = ?
        """,
        (transaction_id,),
    ).fetchone()

    if not row or row["source_type"] != "manual":
        conn.close()
        raise ValueError("Only manual transactions can be deleted")

    cur.execute(
        "DELETE FROM transactions WHERE id = ?",
        (transaction_id,),
    )

    conn.commit()
    conn.close()


def get_transactions_for_statement(
    statement_id: int,
) -> List[Dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT t.*, c.name AS category
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.statement_id = ?
        ORDER BY t.transaction_date
        """,
        (statement_id,),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_transactions_for_statement_exclude_payment(
    statement_id: int,
) -> List[Dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT t.*, c.name AS category
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.statement_id = ? 
            AND t.vendor_normalized NOT LIKE '%payment%'
            AND t.vendor_raw NOT LIKE '%payment%'   
        ORDER BY t.transaction_date
        """,
        (statement_id,),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def assign_category_to_transactions(
    transaction_ids: List[int],
    category_id: int,
):
    conn = get_connection()
    conn.execute(
        f"""
        UPDATE transactions
        SET category_id = ?
        WHERE id IN ({','.join('?' * len(transaction_ids))})
        """,
        [category_id, *transaction_ids],
    )
    conn.commit()
    conn.close()


def is_manual_transaction(transaction_id: int) -> bool:
    conn = get_connection()
    row = conn.execute(
        """
        SELECT 1
        FROM transactions t
        JOIN statements s ON t.statement_id = s.id
        WHERE t.id = ? AND s.source_type = 'manual'
        """,
        (transaction_id,),
    ).fetchone()
    conn.close()
    return row is not None


def get_transaction_by_id(transaction_id: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    row = conn.execute(
        """
        SELECT t.*, c.name AS category
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.id = ?
        """,
        (transaction_id,),
    ).fetchone()
    conn.close()
    return dict(row) if row else None


# =========================
# Category Operations
# =========================

def get_or_create_category(
    name: str,
    parent_id: Optional[int] = None,
) -> int:
    conn = get_connection()
    cur = conn.cursor()

    row = cur.execute(
        "SELECT id FROM categories WHERE name = ?",
        (name,),
    ).fetchone()

    if row:
        conn.close()
        return row["id"]

    cur.execute(
        """
        INSERT INTO categories (name, parent_id)
        VALUES (?, ?)
        """,
        (name, parent_id),
    )
    conn.commit()
    category_id = cur.lastrowid
    conn.close()
    return category_id


def get_categories() -> List[Dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT *
        FROM categories
        ORDER BY name
        """
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]
