import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routes import (
    auth_router, users_router, income_router,
    expenses_router, investments_router, budgets_router,
    goals_router, transactions_router, dashboard_router,
    analytics_router
)

IS_VERCEL = bool(os.environ.get("VERCEL") or os.environ.get("VERCEL_ENV"))

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Only run init_db locally or if not on Vercel.
    # On Vercel (Supabase already has schema), skip the heavy CREATE TABLE
    # round-trip on every cold-start to avoid 10-15s timeout on first request.
    if not IS_VERCEL:
        try:
            init_db()
        except Exception as e:
            print(f"DB init warning: {e}")
    yield

app = FastAPI(
    title="FinTrack API",
    description="Production-ready REST API for Personal Expense, Income, Savings, and Investment Tracker",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration: Allow localhost development and production frontend URLs
# On Vercel serverless, use wildcard to avoid preflight rejecting Vercel preview URLs
if IS_VERCEL or settings.ENVIRONMENT != "production":
    # Allow everything on Vercel (same-domain API requests) and local dev
    cors_origins = ["*"]
    cors_credentials = False  # credentials=True is not compatible with origin="*"
else:
    cors_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://fintrack-seven-mu.vercel.app",
        "https://fintrackixzu.vercel.app",
        "https://fintrack-app.vercel.app",
    ]
    if settings.FRONTEND_URL and settings.FRONTEND_URL not in cors_origins:
        cors_origins.append(settings.FRONTEND_URL.rstrip("/"))
    cors_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=cors_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root & Health endpoints
@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to FinTrack API",
        "status": "online",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}

# Mount API Routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(income_router)
app.include_router(expenses_router)
app.include_router(investments_router)
app.include_router(budgets_router)
app.include_router(goals_router)
app.include_router(transactions_router)
app.include_router(dashboard_router)
app.include_router(analytics_router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
