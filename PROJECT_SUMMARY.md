# 🚀 FinTrack - Complete Project Summary & Report

---

## 📌 Executive Summary

**FinTrack** is a production-grade, full-stack personal finance, expense, income, budget, investment, and wealth management platform. It features real-time financial rollups, dynamic chart visualizations, multi-criteria filtering, security isolation, customizable category engines, and seamless cloud deployment.

---

## 🌐 Live URLs & Links Matrix

| Environment | Service | URL / Link |
|---|---|---|
| **Cloud Production** | Vercel Live App | [https://fintrack-seven-mu.vercel.app](https://fintrack-seven-mu.vercel.app) |
| **Cloud Production** | Vercel API Health | [https://fintrack-seven-mu.vercel.app/health](https://fintrack-seven-mu.vercel.app/health) |
| **Cloud Production** | Vercel Dashboard | [https://vercel.com/fin-track8](https://vercel.com/fin-track8) |
| **GitHub Repository** | Source Code Repo | [https://github.com/irsath-005/fin-track](https://github.com/irsath-005/fin-track) |
| **Local Development** | React Frontend UI | [http://localhost:5173](http://localhost:5173) |
| **Local Development** | FastAPI Backend Base | [http://localhost:8000](http://localhost:8000) |
| **Local Development** | Interactive API Docs | [http://localhost:8000/docs](http://localhost:8000/docs) |
| **Database** | Supabase PostgreSQL Cloud | [Supabase Project](https://supabase.com/dashboard/project/iutsiwsvourdcnrqtxjf) |

---

## 🏛️ System Architecture & Technology Stack

```
      React Frontend (Vite + Tailwind CSS + Recharts + Lucide Icons)
                                 │
                    Axios HTTP Client (JWT Bearer Token)
                                 ▼
         FastAPI Python Backend (Pydantic v2 + OAuth2 Password Bearer)
                                 │
                          SQLAlchemy ORM
                                 ▼
            SQLite / PostgreSQL Database (fintrack.db)
```

### 1. **Frontend (`frontend/`)**
* **Framework**: React 18 + Vite
* **Styling**: Tailwind CSS with custom glassmorphism design tokens & dark/light theme switching
* **Charts**: Recharts (Income vs Expense bar chart, category pie breakdown, savings trend, portfolio donut chart)
* **Routing**: React Router DOM v6 with protected and public route guards

### 2. **Backend (`backend/`)**
* **Framework**: FastAPI (Python 3.14+)
* **Authentication**: JWT tokens (PyJWT), salted bcrypt password hashing (`passlib`)
* **ORM & Database**: SQLAlchemy declarative models with SQLite/PostgreSQL support
* **Validation**: Pydantic v2 request/response schemas

---

## ✨ Features Completed

1. **🔐 Authentication & Security**
   * Account registration, login, logout, and token expiration handling.
   * User data isolation (every record strictly scoped to `user_id == current_user.id`).
   * Password reset workflows with OTP code verification.

2. **📊 Dynamic Dashboard**
   * Real-time metrics: Total Balance, Total Income, Outflows, Net Savings, Savings Rate %, and Remaining Budget.
   * Visual charts & recent transactions feed.

3. **💵 Income Management**
   * Add, edit, delete, search, sort, and filter income entries by category, source, and date range.
   * CSV export support.

4. **💳 Expense Tracking**
   * Record daily expenses with category badges, payment methods (UPI, Credit Card, Bank Transfer, Cash), and merchants.
   * CSV export support.

5. **📈 Investment Portfolio**
   * Track Stocks, Mutual Funds, SIPs, Fixed Deposits, Gold, Cryptocurrency, Real Estate.
   * Automated profit/loss ($Current - Invested$) and ROI percentage calculation.

6. **🏦 Automated Savings Engine**
   * Real-time net savings formula: $Savings = Income - Expenses - Investments$.
   * Savings growth trend visualizer.

7. **🎯 Category Budgets & Financial Goals**
   * Category budget allocation with 80% threshold warnings and 100%+ over-budget alerts.
   * Target vs. current goal milestone progress tracking with quick contribution deposit modals.

8. **🏷️ Enhanced Category System (Recent Update)**
   * Expanded default categories for income (Salary, Freelance, Business, Bonus, Dividends, Crypto Gains, etc.) and expenses (Food, Groceries, Rent, Transportation, Subscription, Pets, etc.).
   * Custom searchable `CategorySelect` component with dynamic `+ Add new category` functionality saved to `localStorage`.

---

## 🗄️ Database Inspection Summary (`fintrack.db`)

* **`users` Table**: Stores user accounts, hashed passwords, reset tokens, and OTP codes.
* **`income` Table**: Stores income entries (amount, source, category, date, payment method).
* **`expenses` Table**: Stores expense entries (amount, category, merchant, date, payment method, notes).
* **`investments` Table**: Stores portfolio holdings (investment name, asset type, invested amount, current value, quantity).
* **`budgets` Table**: Stores monthly category spending targets.
* **`financial_goals` Table**: Stores long-term savings goals and target deadlines.

---

## 🚀 How to Run Locally

### 1. Start FastAPI Backend:
```powershell
cd "c:\Users\irsat\OneDrive\Desktop\expense tracker\backend"
python -m uvicorn app.main:app --port 8000 --reload
```

### 2. Start React Frontend:
```powershell
cd "c:\Users\irsat\OneDrive\Desktop\expense tracker\frontend"
npm run dev
```

---

## 📦 Deployment & Git Summary

* **Git Repository**: All files committed and pushed to `origin main` at [https://github.com/irsath-005/fin-track](https://github.com/irsath-005/fin-track).
* **Vercel Deployment**: Configured via `vercel.json` and deployed live to [https://fintrackixzu.vercel.app](https://fintrackixzu.vercel.app).

---
*Report generated on September 15, 2026 for FinTrack Pro.*
