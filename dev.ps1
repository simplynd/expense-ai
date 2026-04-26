# Start all services in one window (or separate jobs)
cd api
Start-Job { uv run python -m uvicorn main:app --reload --log-level info }        # FastAPI on 8000
Start-Job { uv run python -m uvicorn mcp_server:app --host 127.0.0.1 --port 8001 --reload }  # MCP on 8001
cd..
cd ui; npm run dev                             # Vite on 5173