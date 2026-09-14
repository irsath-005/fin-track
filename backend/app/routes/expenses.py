from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/expenses", tags=["Expenses"])

@router.get("", response_model=List[ExpenseResponse])
def get_all_expenses(
    category: Optional[str] = None,
    payment_method: Optional[str] = None,
    merchant: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("date", pattern="^(date|amount|category|merchant|created_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Expense).filter(Expense.user_id == current_user.id)

    if category:
        query = query.filter(Expense.category == category)
    if payment_method:
        query = query.filter(Expense.payment_method == payment_method)
    if merchant:
        query = query.filter(Expense.merchant.ilike(f"%{merchant}%"))
    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Expense.category.ilike(search_pattern)) |
            (Expense.merchant.ilike(search_pattern)) |
            (Expense.description.ilike(search_pattern)) |
            (Expense.notes.ilike(search_pattern))
        )

    order_col = getattr(Expense, sort_by)
    query = query.order_by(desc(order_col) if sort_order == "desc" else asc(order_col))

    return query.all()

@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    req: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = Expense(
        user_id=current_user.id,
        amount=req.amount,
        category=req.category.strip(),
        date=req.date.strip(),
        payment_method=req.payment_method.strip(),
        merchant=req.merchant.strip() if req.merchant else None,
        description=req.description.strip() if req.description else None,
        notes=req.notes.strip() if req.notes else None
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense

@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense_by_id(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == current_user.id).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense record with ID {expense_id} not found"
        )
    return expense

@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    req: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == current_user.id).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense record with ID {expense_id} not found"
        )

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            if isinstance(value, str):
                value = value.strip()
            setattr(expense, key, value)

    db.commit()
    db.refresh(expense)
    return expense

@router.delete("/{expense_id}", status_code=status.HTTP_200_OK)
def delete_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == current_user.id).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense record with ID {expense_id} not found"
        )

    db.delete(expense)
    db.commit()
    return {"message": "Expense record deleted successfully", "id": expense_id}
