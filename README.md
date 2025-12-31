# 🏦 AI-Powered Personal Finance Auditor (MCP)

An intelligent, privacy-first financial analysis platform that leverages **Local LLMs** and the **Model Context Protocol (MCP)** to transform raw bank data into verified financial insights.

This project goes beyond simple keyword tagging. It uses an **Agentic architecture** where the LLM acts as a *Senior Auditor*—intelligently choosing between database tools to provide **100% mathematically accurate summaries** while ignoring internal transfers and credit card settlements.

---

## 🌟 Key Features

- **Local & Private**  
  Runs entirely on your machine via Ollama. Your financial data never leaves your local environment.

- **Agentic Reasoning**  
  Uses Llama 3.1 to interpret natural language and map it to specific SQL-backed tools.

- **Accurate Arithmetic**  
  Solves the *LLM Math Problem* by offloading all summations and aggregations to the SQLite engine.

- **Smart Filtering**  
  Automatically distinguishes between real spending and internal movements (payments/transfers).

- **Vendor Name Normalization**  
  Uses **mistral-small3.2** to intelligently normalize vendor names, consolidating variations into consistent, human-readable merchants.

- **Persistent Context**  
  Maintains chat history across different dashboard views using React state lifting.

## 🏗️ System Architecture

The project is built on a modular, multi-tier architecture designed for extensibility and local-first execution:

- **UI (React)**  
  A modern dashboard for visualizing transactions, uploading bank statements (PDF/CSV), managing manual transactions, categorizing expenses, and interacting with the AI-powered *Senior Auditor*.

- **Application API (Python / FastAPI)**  
  A RESTful backend that supports UI-driven features such as:
  - PDF bank statement uploads and parsing
  - User-driven transaction categorization
  - Manual transaction creation and editing
  - Aggregated financial summaries for dashboard views  
  This layer handles validation, persistence, and orchestration between the UI, database, and AI services.

- **MCP Server (Python / FastMCP)**  
  A specialized service that securely exposes SQLite-backed financial data to the LLM via high-performance, deterministic tools—ensuring all calculations remain mathematically accurate.

- **Local LLM Runtime (Ollama)**  
  The local reasoning engine that processes user intent and orchestrates tool calls:
  - **Llama 3.1** for agentic reasoning and financial analysis  
  - **mistral-small3.2** for vendor name normalization and categorization


## 🛠️ Prerequisites

- **Ollama** — https://ollama.com  
- **Node.js** — v18.0.0 or higher  
- **Python** — 3.12+  
- **Database** — SQLite (built-in)
- **uv** — https://docs.astral.sh/uv/getting-started/installation/

---

## 🚀 Getting Started

### 1. Setup the Local LLMs

Ensure Ollama is installed and running, then pull the required models:

```bash
ollama pull llama3.1
ollama pull mistral-small3.2
```

### 2. Start the Backend Services (FastAPI + MCP)

This project uses uv for Python dependency management and service execution.

Navigate to the api directory:

```bash
cd api
```

Sync Dependencies
Before starting any services, install/update all Python dependencies:

```bash
uv sync
```

Start the MCP Server
Exposes SQLite-backed financial data to the LLM via MCP tools:

```bash
uv run python -m uvicorn mcp_server:app --host 127.0.0.1 --port 8001 --reload
```

Start the Application API (FastAPI)
Supports UI-driven features such as PDF uploads, transaction categorization, manual transaction creation, and dashboard summaries:

```bash
uv run python -m uvicorn main:app --reload --log-level info
```

### 3. Launch the UI Dashboard

Navigate to the root or UI directory, install dependencies, and start the React app:

```bash
npm install
npm run dev
```

# 📖 Application Workflow

Follow this standard process to move from raw financial documents to AI-powered insights:

---

### Step 1: Data Ingestion (PDF)

- **Upload:** Your text-based PDF credit card statements (OCR not currently supported).  
- **Parsing:** The backend extracts clean transaction rows from the PDF noise.  
- **Normalization:** An LLM process automatically cleans messy bank strings into readable vendor names (e.g., AMZNMktpCA*B83MD becomes Amazon).  
- **Storage:** Verified data is committed to your local SQLite database.

[Statement Page](./data/images/Statement.png)
---

### Step 2: Review & Categorize

- **Navigate:** Go to the transaction ledger to audit the imported data.  
- **Assignment:** Manually assign categories (Groceries, Transportation, etc.) to transactions.  
- **Future AI:** Future iterations will include auto-categorization based on your historical mapping patterns.

[Category Page](./data/images/Category.png)
---

### Step 3: Adjunct Outlay (Manual Entry)

- **Log expenses** that don't appear on credit card statements to ensure a complete financial picture.  
- **Fixed Costs:** Manually enter recurring payments like Mortgage/Rent or Property Taxes.  
- **Utilities:** Log direct-debit bills or e-transfers for electricity, water, or internet.  
- **Cash Expenses:** Record out-of-pocket cash transactions to maintain 100% accuracy in your spending totals.

[Adjunct Outlay](./data/images/Outlay.png)
---

### Step 4: Dashboard Visualization

View high-level financial health metrics on the main dashboard:

- **Aggregated Totals:** Yearly net spending and average monthly outflow.  
- **Trends:** Monthly expense charts and category-based distribution.  
- **Fixed vs. Variable:** Analyze the split between your manual fixed costs and credit card variable spending.

[Dashboard](./data/images/Dashboard.png)
---

### Step 5: AI Insights (The Auditor)

Interact with the "Senior Auditor" chat interface. The LLM utilizes its MCP Tools to query the database and perform verified analysis.

- **Accuracy:** The agent offloads math to the database to ensure totals are 100% correct.  
- **Example Queries:**  
  - "What was my total spending for 2025 across all sources?"  
  - "How much have I paid in Mortgage and Utilities year-to-date?"  
  - "Show me a list of my Amazon purchases over $100."

[AI Insight](./data/images/Insight.png)

## 🗺️ Roadmap

- [ ] Automated Ingestion: PDF and CSV drag-and-drop support for bank statements  
- [ ] Advanced Categorization: Machine-learning based vendor normalization and transactions categorization
- [ ] Data Visualization: AI-generated charts and spending trend heatmaps  

---

## ⚖️ License

Distributed under the **MIT License**.  
See the `LICENSE` file for more information.