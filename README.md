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

- **Persistent Context**  
  Maintains chat history across different dashboard views using React state lifting.

---

## 🏗️ System Architecture

The project is built on a three-tier architecture designed for extensibility:

- **UI (React)**  
  A modern dashboard for visualizing transactions and interacting with the AI Agent.

- **MCP Server (Python / FastMCP)**  
  A bridge that exposes the SQLite database to the LLM via secure, high-performance tools.

- **Local LLM (Ollama)**  
  The reasoning engine (Llama 3.1 or Qwen 2.5) that processes user intent and orchestrates tool calls.

---

## 🛠️ Prerequisites

- **Ollama** — https://ollama.com  
- **Node.js** — v18.0.0 or higher  
- **Python** — 3.10+  
- **Database** — SQLite (built-in)

---

## 🚀 Getting Started

### 1. Setup the LLM

Ensure Ollama is installed and running, then pull the recommended model:

```bash
ollama run llama3.1
```

### 2. Configure the MCP Backend

Navigate to the `/api` folder and install the necessary Python dependencies:

```bash
pip install mcp fastmcp pandas
```

Start the MCP server to expose the database tools:

```bash
mcp run mcp_server.py
```

### 3. Launch the UI Dashboard

Navigate to the root or UI directory, install dependencies, and start the React app:

```bash
npm install
npm run dev
```

## 💬 Usage & Examples

The **Senior Auditor** is trained to handle complex financial queries. You can interact with the chat interface using natural language:

- **The Big Picture**  
  *"What was my total net spending in 2025?"*  
  → The agent triggers `get_net_spending_summary` for a mathematically verified total (**$10,872.88**).

- **Vendor Specifics**  
  *"How much did I spend at Amazon? Include any refunds."*

- **Specific Entities**  
  *"Find any expenses related to BGD Fresh Milk."*

- **Reasoning Queries**  
  *"Why is my total spending different from my bank balance?"*  
  → The agent explains how internal credit card payments were filtered out to show true expenses.

---

## 🔧 Technical Details

### MCP Tools Exposed

- **`get_net_spending_summary`**  
  High-accuracy SQL aggregation for yearly totals (database-level math).

- **`search_spending`**  
  Fuzzy-search tool for finding specific vendors or categories.

- **`fetch_all_transactions_for_year`**  
  Provides raw data context for detailed analysis and list views.

---

## 🗺️ Roadmap

- [ ] Automated Ingestion: PDF and CSV drag-and-drop support for bank statements  
- [ ] Advanced Categorization: Machine-learning based vendor normalization  
- [ ] Data Visualization: AI-generated charts and spending trend heatmaps  

---

## ⚖️ License

Distributed under the **MIT License**.  
See the `LICENSE` file for more information.