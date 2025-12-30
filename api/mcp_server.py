from fastmcp import FastMCP
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from typing import List, Optional
from db.db import get_spending_summary, search_transactions, get_categories

# Initialize FastMCP Server
mcp = FastMCP("Expense-AI-Analyst")

# --- Your Tools remain the same ---

@mcp.tool()
def get_yearly_summary(year: int = 2025) -> str:
    """Retrieves a total spending breakdown by category for a year."""
    data = get_spending_summary(year)
    if not data: return f"No data for {year}"
    return "\n".join([f"- {item['category'] or 'Uncategorized'}: ${item['total_amount']}" for item in data])

@mcp.tool()
def find_transactions(vendor: Optional[str] = None, category: Optional[str] = None) -> List[dict]:
    """Finds specific transaction line items."""
    return search_transactions(vendor=vendor, category=category)

@mcp.tool()
def list_available_categories() -> List[str]:
    """Returns a list of all existing expense categories."""
    return [c['name'] for c in get_categories()]

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