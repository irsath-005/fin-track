from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.income import router as income_router
from app.routes.expenses import router as expenses_router
from app.routes.investments import router as investments_router
from app.routes.budgets import router as budgets_router
from app.routes.goals import router as goals_router
from app.routes.transactions import router as transactions_router
from app.routes.dashboard import router as dashboard_router
from app.routes.analytics import router as analytics_router

__all__ = [
    "auth_router",
    "users_router",
    "income_router",
    "expenses_router",
    "investments_router",
    "budgets_router",
    "goals_router",
    "transactions_router",
    "dashboard_router",
    "analytics_router"
]
