from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.income import Income
from app.schemas.income import IncomeCreate, IncomeUpdate, IncomeResponse
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/income", tags=["Income"])

@router.get("", response_model=List[IncomeResponse])
def get_all_income(
    category: Optional[str] = None,
    payment_method: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("date", pattern="^(date|amount|source|created_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Income).filter(Income.user_id == current_user.id)

    if category:
        query = query.filter(Income.category == category)
    if payment_method:
        query = query.filter(Income.payment_method == payment_method)
    if start_date:
        query = query.filter(Income.date >= start_date)
    if end_date:
        query = query.filter(Income.date <= end_date)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Income.source.ilike(search_pattern)) | 
            (Income.description.ilike(search_pattern)) |
            (Income.category.ilike(search_pattern))
        )

    order_col = getattr(Income, sort_by)
    query = query.order_by(desc(order_col) if sort_order == "desc" else asc(order_col))

    return query.all()

@router.post("", response_model=IncomeResponse, status_code=status.HTTP_201_CREATED)
def create_income(
    req: IncomeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    income = Income(
        user_id=current_user.id,
        amount=req.amount,
        source=req.source.strip(),
        category=req.category.strip(),
        date=req.date.strip(),
        payment_method=req.payment_method.strip(),
        description=req.description.strip() if req.description else None
    )
    db.add(income)
    db.commit()
    db.refresh(income)
    return income

@router.get("/{income_id}", response_model=IncomeResponse)
def get_income_by_id(
    income_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    income = db.query(Income).filter(Income.id == income_id, Income.user_id == current_user.id).first()
    if not income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Income record with ID {income_id} not found"
        )
    return income

@router.put("/{income_id}", response_model=IncomeResponse)
def update_income(
    income_id: int,
    req: IncomeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    income = db.query(Income).filter(Income.id == income_id, Income.user_id == current_user.id).first()
    if not income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Income record with ID {income_id} not found"
        )
    
    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            if isinstance(value, str):
                value = value.strip()
            setattr(income, key, value)

    db.commit()
    db.refresh(income)
    return income

@router.delete("/{income_id}", status_code=status.HTTP_200_OK)
def delete_income(
    income_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    income = db.query(Income).filter(Income.id == income_id, Income.user_id == current_user.id).first()
    if not income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Income record with ID {income_id} not found"
        )
    
    db.delete(income)
    db.commit()
    return {"message": "Income record deleted successfully", "id": income_id}
