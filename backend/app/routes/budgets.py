from fastapi import APIRouter, Depends, HTTPException, Query, status
from datetime import datetime
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.budget import Budget
from app.models.expense import Expense
from app.schemas.budget import (
    BudgetCreate, BudgetUpdate, BudgetResponse, BudgetStatusResponse
)
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/budgets", tags=["Budgets"])

def calculate_budget_response(budget: Budget, db: Session) -> BudgetResponse:
    prefix = f"{budget.year}-{budget.month:02d}"
    expenses = db.query(Expense).filter(
        Expense.user_id == budget.user_id,
        Expense.category == budget.category,
        Expense.date.startswith(prefix)
    ).all()
    spent = sum(e.amount for e in expenses)
    remaining = budget.amount - spent
    pct = (spent / budget.amount * 100) if budget.amount > 0 else 0.0

    if pct >= 100:
        status_str = "exceeded"
    elif pct >= 80:
        status_str = "warning"
    else:
        status_str = "normal"

    return BudgetResponse(
        id=budget.id,
        user_id=budget.user_id,
        category=budget.category,
        amount=budget.amount,
        month=budget.month,
        year=budget.year,
        spent=round(spent, 2),
        remaining=round(remaining, 2),
        percentage_used=round(pct, 2),
        status=status_str,
        created_at=budget.created_at
    )

@router.get("", response_model=List[BudgetResponse])
def get_budgets(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    m = month if month is not None else now.month
    y = year if year is not None else now.year

    query = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == m,
        Budget.year == y
    )
    budgets = query.all()
    return [calculate_budget_response(b, db) for b in budgets]

@router.get("/status", response_model=BudgetStatusResponse)
def get_budget_status(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    m = month if month is not None else now.month
    y = year if year is not None else now.year

    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == m,
        Budget.year == y
    ).all()

    formatted_budgets = [calculate_budget_response(b, db) for b in budgets]
    total_budgeted = sum(b.amount for b in formatted_budgets)
    total_spent = sum(b.spent for b in formatted_budgets)
    total_remaining = total_budgeted - total_spent

    return BudgetStatusResponse(
        total_budgeted=round(total_budgeted, 2),
        total_spent=round(total_spent, 2),
        total_remaining=round(total_remaining, 2),
        budgets=formatted_budgets
    )

@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(
    req: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if budget for same category, month, and year already exists
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category == req.category.strip(),
        Budget.month == req.month,
        Budget.year == req.year
    ).first()

    if existing:
        # Update existing instead of erroring out
        existing.amount = req.amount
        db.commit()
        db.refresh(existing)
        return calculate_budget_response(existing, db)

    budget = Budget(
        user_id=current_user.id,
        category=req.category.strip(),
        amount=req.amount,
        month=req.month,
        year=req.year
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return calculate_budget_response(budget, db)

@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: int,
    req: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Budget with ID {budget_id} not found"
        )

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            if isinstance(value, str):
                value = value.strip()
            setattr(budget, key, value)

    db.commit()
    db.refresh(budget)
    return calculate_budget_response(budget, db)

@router.delete("/{budget_id}", status_code=status.HTTP_200_OK)
def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Budget with ID {budget_id} not found"
        )

    db.delete(budget)
    db.commit()
    return {"message": "Budget deleted successfully", "id": budget_id}
