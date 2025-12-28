-- =========================
-- Statements
-- =========================
CREATE TABLE IF NOT EXISTS statements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    file_size INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (
        status IN ('uploaded', 'processing', 'completed', 'failed')
    ),
    source_type TEXT NOT NULL DEFAULT 'pdf' CHECK (
        source_type IN ('pdf', 'manual')
    ),
    error_message TEXT,
    processed_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_statements_status
ON statements(status);

CREATE INDEX IF NOT EXISTS idx_statements_source_type
ON statements(source_type);


-- =========================
-- Categories
-- =========================
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    parent_id INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_categories_parent
ON categories(parent_id);


-- =========================
-- Transactions
-- =========================
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    statement_id INTEGER NOT NULL,
    transaction_date TEXT NOT NULL,
    vendor_raw TEXT NOT NULL,
    vendor_normalized TEXT,
    amount REAL NOT NULL,
    category_id INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (statement_id) REFERENCES statements(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Vendor cache table
CREATE TABLE IF NOT EXISTS vendor_cache (
    raw_vendor TEXT PRIMARY KEY,
    normalized_vendor TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_statement
ON transactions(statement_id);

CREATE INDEX IF NOT EXISTS idx_transactions_date
ON transactions(transaction_date);

CREATE INDEX IF NOT EXISTS idx_transactions_category
ON transactions(category_id);

CREATE INDEX IF NOT EXISTS idx_transactions_vendor_norm
ON transactions(vendor_normalized);
