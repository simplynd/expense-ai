from fastapi import FastAPI
from contextlib import asynccontextmanager

from api.db.db import init_db

# Routers (empty for now, will be added later)
from api.handler.statements import router as statements_router
# from api.handler.transactions import router as transactions_router
# from api.handler.dashboard import router as dashboard_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup & shutdown lifecycle.
    """
    # Startup
    init_db()
    print("✅ Database initialized")

    yield

    # Shutdown
    print("🛑 FastAPI shutting down")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Expense AI",
        description="Personal expense tracking and analysis platform",
        version="0.1.0",
        lifespan=lifespan
    )

    # Routers will be plugged in here
    app.include_router(statements_router, prefix="/statements", tags=["Statements"])
    # app.include_router(transactions_router, prefix="/transactions", tags=["Transactions"])
    # app.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])

    return app


app = create_app()
