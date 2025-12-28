from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

from db.db import init_db
from tool.logging_config import logger

# Routers
from handler.statement import router as statements_router
from handler.transaction import router as transactions_router
from handler.dashboard import router as dashboard_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup & shutdown lifecycle.
    """
    # Startup
    init_db()
    logger.info("✅ Database initialized")

    yield

    # Shutdown
    logger.info("🛑 FastAPI shutting down")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Expense AI",
        description="Personal expense tracking and analysis platform",
        version="0.1.0",
        lifespan=lifespan
    )

    # ✅ CORS (added — nothing else changed)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],          # tighten later if needed
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(statements_router, prefix="/statements", tags=["Statements"])
    app.include_router(transactions_router, prefix="/transactions", tags=["Transactions"])
    app.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])

    return app


app = create_app()
