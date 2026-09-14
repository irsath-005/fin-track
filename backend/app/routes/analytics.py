from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.schemas.analytics import (
    MonthlyBreakdownItem, CategorySpendingItem, YearlyFinancialSummary, FinancialInsight
)
from app.services.analytics_service import (
    get_monthly_breakdown, get_category_spending, get_yearly_financial_summary
)
from app.services.insights_service import generate_financial_insights
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics & Reports"])

@router.get("/monthly", response_model=List[MonthlyBreakdownItem])
def get_monthly_analytics(
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    y = year or datetime.utcnow().year
    return get_monthly_breakdown(db, current_user.id, y)

@router.get("/categories", response_model=List[CategorySpendingItem])
def get_categories_analytics(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_category_spending(db, current_user.id, month=month, year=year)

@router.get("/yearly", response_model=YearlyFinancialSummary)
def get_yearly_analytics(
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    y = year or datetime.utcnow().year
    return get_yearly_financial_summary(db, current_user.id, y)

@router.get("/insights", response_model=List[FinancialInsight])
def get_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return generate_financial_insights(db, current_user.id)
