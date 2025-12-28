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
    # print("✅ Database initialized")

# =========================
# Statement Operations
# =========================

def create_statement(filename: str, file_size: int, status: str) -> int:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO statements (filename, file_size, status)
        VALUES (?, ?, ?)
        """,
        (filename, file_size, status),
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
        AND t.vendor_normalized NOT LIKE '%payment%'  -- Excludes vendors with 'payment' in the name
        AND t.vendor_raw NOT LIKE '%payment%'         -- Backup check for raw vendor names
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
