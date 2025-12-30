# Start all services in one window (or separate jobs)
Start-Job { uv run python -m uvicorn main:app --reload --log-level info }        # FastAPI on 8000
Start-Job { uv run python api/mcp_server.py }  # MCP on 8001
cd ui; npm run dev                             # Vite on 5173