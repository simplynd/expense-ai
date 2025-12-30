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
    Use this for broad, high-level questions about a specific year. 
    Ideal for: 'Total spend in 2024', 'What was my biggest category last year?', or 'Summary of 2025'.
    """
    data = get_yearly_transactions(year)
    if not data:
        return f"No transaction data found for the year {year}."
    
    # We convert to a clean string format to save tokens
    output = [f"{t['transaction_date']} | {t['vendor']} | ${t['amount']} | {t['category'] or 'Uncategorized'}" for t in data]
    return "\n".join(output)

@mcp.tool()
def search_spending(query_term: str) -> str:
    """
    Use this for targeted searches regarding specific names, shops, or types of spending.
    Ideal for: 'How much did I spend at Amazon?', 'Show me all Grocery bills', or 'Find transactions for Starbucks'.
    """
    data = search_transactions(query_term)
    if not data:
        return f"No transactions found matching '{query_term}'."
    
    output = [f"{t['transaction_date']} | {t['vendor']} | ${t['amount']} | {t['category'] or 'Uncategorized'}" for t in data]
    return "\n".join(output)

@mcp.tool()
def get_net_spending_summary(year: int) -> str:
    """
    Use this tool ONLY when the user asks for 'total spending', 'net spend', 
    or a summary of a specific year. 
    This tool is 100% accurate as it performs math at the database level.
    """
    result = get_net_spending_aggregation(year)
    
    if result['net_total'] is None:
        return f"No spending data found for the year {year}."
    
    return (
        f"Calculated Net Spending for {year}: ${result['net_total']}. "
        f"This was calculated across {result['transaction_count']} individual transactions, "
        f"automatically excluding internal payments and accounting for refunds."
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