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