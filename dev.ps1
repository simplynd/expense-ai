Write-Host "🚀 Starting Expense AI Development Environment..." -ForegroundColor Cyan

Write-Host "1. Starting FastAPI Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$host.ui.RawUI.WindowTitle = 'FastAPI Backend'; cd api; uv run python -m uvicorn main:app --reload --log-level info"

Write-Host "2. Starting MCP Server..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$host.ui.RawUI.WindowTitle = 'MCP Server'; cd api; uv run python -m uvicorn mcp_server:app --host 127.0.0.1 --port 8001 --reload"

Write-Host "3. Starting React UI..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$host.ui.RawUI.WindowTitle = 'React UI'; cd ui; npm run dev"

Write-Host "✅ All components are booting up in separate windows!" -ForegroundColor Green