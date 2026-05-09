from fastmcp import FastMCP
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from typing import List, Optional
from db.db import get_yearly_transactions, search_transactions, get_net_spending_aggregation

# Initialize FastMCP Server
mcp = FastMCP("Expense-AI-Analyst")

# --- Your Tools remain the same ---

@mcp.tool()
def fetch_all_transactions_for_year(year: int) -> str:
    """
    Fetches all transactions for a specific year. 
    SCHEMA: transaction_date (YYYY-MM-DD), vendor_normalized, amount, category_name.
    Use this for high-level questions like 'What was my biggest category in 2024?'.
    """
    data = get_yearly_transactions(year)
    if not data:
        return f"No transaction data found for the year {year}."
    
    output = [f"{t['transaction_date']} | {t['vendor']} | ${t['amount']} | {t['category'] or 'Uncategorized'}" for t in data]
    return "\n".join(output)

@mcp.tool()
def search_spending(query_term: str) -> str:
    """
    Search transactions by vendor name or category.
    Use this for: 'How much at Amazon?', 'Show me Starbucks visits', or 'Groceries'.
    """
    data = search_transactions(query_term)
    if not data:
        return f"No transactions found matching '{query_term}'."
    
    output = [f"{t['transaction_date']} | {t['vendor']} | ${t['amount']} | {t['category'] or 'Uncategorized'}" for t in data]
    return "\n".join(output)

@mcp.tool()
def get_net_spending_summary(year: int) -> str:
    """
    REQUIRED for 'total spend', 'net spending', or 'annual summary'.
    This performs a SUM(amount) in SQLite and handles refunds (negative amounts) correctly.
    It returns: net_total (sum), transaction_count, and year.
    """
    result = get_net_spending_aggregation(year)
    
    if result['net_total'] is None:
        return f"No spending data found for the year {year}."
    
    return (
        f"Calculated Net Spending for {year}: ${result['net_total']:.2f}. "
        f"Records: {result['transaction_count']}. "
        f"Internal transfers were automatically excluded."
    )

# --- The "Magic" Bridge ---
# Configure CORS for browser-based clients
middleware = [
    Middleware(
        CORSMiddleware,
        allow_origins=["*"],  
        allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=[
            "mcp-protocol-version",
            "mcp-session-id",
            "Authorization",
            "Content-Type",
        ],
        expose_headers=["mcp-session-id"],
    )
]

# This creates the 'app' object that uvicorn looks for
app = mcp.http_app(middleware=middleware)