# FinTrack - Full-Stack Personal Wealth, Expense & Investment Tracker

**FinTrack** is a production-grade, full-stack financial platform designed to track income streams, daily expenses, category budgets, multi-asset investment portfolios, savings growth, and financial goals with real-time analytics and automated AI insights.

---

## 🏛️ System Architecture

```
React Frontend (Vite + Tailwind + Recharts)
                      ↓ (Axios with Bearer JWT)
FastAPI Backend (REST API + Pydantic v2)
                      ↓ (SQLAlchemy ORM)
PostgreSQL Cloud Database (Render / Neon / Supabase)
```

---

## ✨ Key Features

- 🔐 **Authentication & Security**: JWT bearer authentication, bcrypt password hashing, token expiration handling, forgot/reset password workflows, and **strict user data isolation**.
- 📊 **Dynamic Financial Dashboard**: Real-time KPI summaries (Total Balance, Total Income, Outflows, Investments, Savings, Savings Rate, Remaining Budget) and automated statistical insight cards.
- 💵 **Income Streams Management**: Full CRUD, source tracking, category categorization, date range filtering, search, sorting, and CSV export.
- 💳 **Expense & Outflow Tracking**: Full CRUD, merchant tracking, category color badges, payment method filters, and CSV export.
- 📈 **Investment Portfolio**: Track Stocks, Mutual Funds, SIPs, Crypto, Fixed Deposits, Gold, Real Estate with automated Profit/Loss ($Current - Invested$) and ROI percentage ($((Current - Invested)/Invested) \times 100$).
- 🏦 **Automated Savings Engine**: Calculates real-time savings ($Savings = Income - Expenses - Investments$), savings rate %, and historical trend visualization.
- 🎯 **Category Budgets**: Set category budget limits with real-time expenditure synchronization, 80% threshold warnings, and 100%+ over-budget alerts.
- 🏆 **Financial Milestones & Goals**: Target vs. current progress tracking with completion percentages and quick contribution deposit modals.
- 🔄 **Unified Transaction Journal**: One central ledger combining Incomes (Green), Expenses (Red), and Investments (Blue) with multi-criteria filters, search, and pagination.
- 📑 **Analytical Reports & Statements**: Monthly and yearly financial rollups, category distributions, portfolio allocations, CSV export, and print-ready PDF statements.
- 🌓 **Fintech UI/UX**: Dark mode & Light mode, glassmorphism design, mobile responsive navigation, and toast notifications.

---

## 📁 Project Structure

```
expense tracker/
├── backend/
│   ├── app/
│   │   ├── auth/            # JWT authentication, bcrypt, current_user dependencies
│   │   ├── models/          # SQLAlchemy database models (User, Income, Expense, Investment, Budget, Goal)
│   │   ├── routes/          # FastAPI REST endpoints
│   │   ├── schemas/         # Pydantic v2 request/response validation models
│   │   ├── services/        # Business logic, analytics rollups, and dynamic insights
│   │   ├── config.py        # Environment settings (Pydantic BaseSettings)
│   │   ├── database.py      # SQLAlchemy engine, session maker, and schema init
│   │   └── main.py          # FastAPI application entry point, CORS, and health check
│   ├── tests/
│   │   └── test_api.py      # Automated pytest suite verifying auth, CRUD & isolation
│   ├── Dockerfile           # Backend containerization
│   ├── requirements.txt     # Python backend dependencies
│   └── .env.example         # Backend environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/      # Recharts visualizations (IncomeExpense, Pie, Portfolio, Savings)
│   │   │   ├── common/      # StatCard, Modal, Loader, EmptyState, ConfirmationDialog
│   │   │   └── layout/      # Sidebar, Navbar, AppLayout with responsive drawer
│   │   ├── context/         # AuthContext, ThemeContext, ToastContext
│   │   ├── hooks/           # useAuth, useTheme, useToast custom hooks
│   │   ├── pages/           # Dashboard, Income, Expenses, Investments, Savings, Budgets, Goals, Transactions, Reports, Profile, Auth
│   │   ├── services/        # Central Axios client and resource services
│   │   ├── utils/           # Formatters, constants, CSV export and print utilities
│   │   ├── App.jsx          # React Router route definitions and route guards
│   │   ├── index.css        # Tailwind CSS directives and custom design tokens
│   │   └── main.jsx         # React DOM entry point
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── vercel.json          # Frontend SPA routing configuration
│   └── .env.example
├── .github/
│   └── workflows/
│       └── ci-cd.yml        # GitHub Actions CI pipeline
├── render.yaml              # Render Blueprint for FastAPI Backend + PostgreSQL Database
├── vercel.json              # Vercel deployment configuration
├── .gitignore               # Production gitignore
└── README.md
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Default / Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection URI (or SQLite fallback) | `postgresql://user:pass@host:5432/fintrack_db` |
| `JWT_SECRET_KEY` | Secret key for signing JWT tokens (min 32 chars) | `your-secure-random-secret-key` |
| `JWT_ALGORITHM` | JWT cryptographic algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry duration in minutes | `1440` (24 hours) |
| `FRONTEND_URL` | Allowed origin for CORS in production | `https://fintrack-app.vercel.app` |
| `ENVIRONMENT` | Environment type | `development` or `production` |

### Frontend (`frontend/.env`)
| Variable | Description | Default / Example |
|---|---|---|
| `VITE_API_URL` | Base URL of the running FastAPI backend | `http://localhost:8000` or `https://fintrack-backend.onrender.com` |

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create local environment file
cp .env.example .env

# Run automated tests
pytest tests -v

# Start FastAPI backend server (starts on http://localhost:8000)
uvicorn app.main:app --reload --port 8000
```
API Documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 3. Frontend Setup
```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install node dependencies
npm install

# Create local environment file
cp .env.example .env

# Start Vite development server (starts on http://localhost:5173)
npm run dev
```

---

## 🌐 Production Deployment Guide

### A. Automatic Deployment via GitHub & Render Blueprint

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Production FinTrack Full-Stack App"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/fintrack.git
   git push -u origin main
   ```

2. **Deploy Backend + PostgreSQL on Render**:
   - Log into [Render.com](https://render.com).
   - Click **New** → **Blueprint**.
   - Connect your GitHub repository.
   - Render automatically reads `render.yaml`, spins up a managed PostgreSQL database, configures the environment variables, builds the FastAPI backend, and starts the service.
   - Note down your backend URL (e.g., `https://fintrack-backend.onrender.com`).

3. **Deploy Frontend on Vercel**:
   - Log into [Vercel.com](https://vercel.com).
   - Click **Add New** → **Project** and import your GitHub repository.
   - Set **Root Directory** to `frontend`.
   - In **Environment Variables**, add:
     - `VITE_API_URL` = `https://fintrack-backend.onrender.com` (your Render backend URL)
   - Click **Deploy**. Vercel will build and deploy the React application with automatic continuous deployment on every git push.

4. **Update Backend CORS**:
   - On Render, set `FRONTEND_URL` = `https://your-app-name.vercel.app`.

---

## 📡 REST API Specification

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/health` | Health check endpoint | No |
| `POST` | `/auth/register` | Register new user account | No |
| `POST` | `/auth/login` | Authenticate and obtain JWT token | No |
| `POST` | `/auth/forgot-password` | Request password reset token | No |
| `POST` | `/auth/reset-password` | Reset account password | No |
| `GET` | `/users/me` | Fetch authenticated user profile | Yes |
| `PUT` | `/users/me` | Update user profile name | Yes |
| `PUT` | `/users/change-password` | Change account password | Yes |
| `GET` | `/dashboard/summary` | Aggregated metrics, charts & insights | Yes |
| `GET` | `/income` | List and filter income records | Yes |
| `POST` | `/income` | Create new income entry | Yes |
| `PUT` | `/income/{id}` | Update income entry | Yes |
| `DELETE` | `/income/{id}` | Delete income entry | Yes |
| `GET` | `/expenses` | List and filter expenses | Yes |
| `POST` | `/expenses` | Record new expense entry | Yes |
| `PUT` | `/expenses/{id}` | Update expense entry | Yes |
| `DELETE` | `/expenses/{id}` | Delete expense entry | Yes |
| `GET` | `/investments` | List portfolio assets | Yes |
| `GET` | `/investments/summary` | Total invested & portfolio value | Yes |
| `POST` | `/investments` | Record new investment asset | Yes |
| `PUT` | `/investments/{id}` | Update investment asset | Yes |
| `DELETE` | `/investments/{id}` | Remove investment asset | Yes |
| `GET` | `/budgets` | Fetch monthly category budgets | Yes |
| `GET` | `/budgets/status` | Budget utilization and warnings | Yes |
| `POST` | `/budgets` | Configure category budget | Yes |
| `PUT` | `/budgets/{id}` | Modify budget limit | Yes |
| `DELETE` | `/budgets/{id}` | Delete category budget | Yes |
| `GET` | `/goals` | List financial goals and progress % | Yes |
| `POST` | `/goals` | Create financial goal | Yes |
| `PUT` | `/goals/{id}` | Update goal / deposit contribution | Yes |
| `DELETE` | `/goals/{id}` | Delete financial goal | Yes |
| `GET` | `/transactions` | Unified pagination ledger | Yes |
| `GET` | `/analytics/monthly` | Monthly income, expense, savings | Yes |
| `GET` | `/analytics/categories` | Spending breakdown by category | Yes |
| `GET` | `/analytics/yearly` | Full yearly statement rollup | Yes |
| `GET` | `/analytics/insights` | Automated dynamic insights | Yes |

---

## 🔒 Security & Data Isolation

1. **User Isolation**: All database queries strictly filter by `user_id == current_user.id`. Modifying or accessing another user's ID yields HTTP 404.
2. **Password Security**: Cryptographic salted hashing via standard `bcrypt`.
3. **Protected APIs**: Endpoints protected using FastAPI dependency injection checking JWT bearer tokens.
4. **CORS Hardened**: Production restricts origins to authorized frontend domains.

---

## 📜 License
MIT License. Built for full-stack production deployments.
