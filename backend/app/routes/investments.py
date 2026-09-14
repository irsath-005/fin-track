from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.investment import Investment
from app.schemas.investment import (
    InvestmentCreate, InvestmentUpdate, InvestmentResponse, InvestmentSummary
)
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/investments", tags=["Investments"])

def format_investment_response(inv: Investment) -> InvestmentResponse:
    profit_loss = inv.current_value - inv.amount_invested
    ret_pct = (profit_loss / inv.amount_invested * 100) if inv.amount_invested > 0 else 0.0
    return InvestmentResponse(
        id=inv.id,
        user_id=inv.user_id,
        investment_name=inv.investment_name,
        investment_type=inv.investment_type,
        amount_invested=inv.amount_invested,
        current_value=inv.current_value,
        investment_date=inv.investment_date,
        quantity=inv.quantity,
        purchase_price=inv.purchase_price,
        current_price=inv.current_price,
        expected_return=inv.expected_return,
        notes=inv.notes,
        profit_loss=round(profit_loss, 2),
        return_percentage=round(ret_pct, 2),
        created_at=inv.created_at
    )

@router.get("", response_model=List[InvestmentResponse])
def get_all_investments(
    investment_type: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("investment_date", pattern="^(investment_date|amount_invested|current_value|investment_name|created_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Investment).filter(Investment.user_id == current_user.id)

    if investment_type:
        query = query.filter(Investment.investment_type == investment_type)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Investment.investment_name.ilike(search_pattern)) |
            (Investment.investment_type.ilike(search_pattern)) |
            (Investment.notes.ilike(search_pattern))
        )

    order_col = getattr(Investment, sort_by)
    query = query.order_by(desc(order_col) if sort_order == "desc" else asc(order_col))

    investments = query.all()
    return [format_investment_response(inv) for inv in investments]

@router.get("/summary", response_model=InvestmentSummary)
def get_investments_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    investments = db.query(Investment).filter(Investment.user_id == current_user.id).all()
    tot_invested = sum(i.amount_invested for i in investments)
    tot_value = sum(i.current_value for i in investments)
    tot_pl = tot_value - tot_invested
    tot_return_pct = (tot_pl / tot_invested * 100) if tot_invested > 0 else 0.0

    return InvestmentSummary(
        total_invested=round(tot_invested, 2),
        current_portfolio_value=round(tot_value, 2),
        total_profit_loss=round(tot_pl, 2),
        total_return_percentage=round(tot_return_pct, 2)
    )

@router.post("", response_model=InvestmentResponse, status_code=status.HTTP_201_CREATED)
def create_investment(
    req: InvestmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    curr_val = req.current_value
    if curr_val == 0.0 and req.quantity and req.current_price:
        curr_val = req.quantity * req.current_price

    inv = Investment(
        user_id=current_user.id,
        investment_name=req.investment_name.strip(),
        investment_type=req.investment_type.strip(),
        amount_invested=req.amount_invested,
        current_value=curr_val,
        investment_date=req.investment_date.strip(),
        quantity=req.quantity,
        purchase_price=req.purchase_price,
        current_price=req.current_price,
        expected_return=req.expected_return,
        notes=req.notes.strip() if req.notes else None
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return format_investment_response(inv)

@router.get("/{investment_id}", response_model=InvestmentResponse)
def get_investment_by_id(
    investment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inv = db.query(Investment).filter(Investment.id == investment_id, Investment.user_id == current_user.id).first()
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investment record with ID {investment_id} not found"
        )
    return format_investment_response(inv)

@router.put("/{investment_id}", response_model=InvestmentResponse)
def update_investment(
    investment_id: int,
    req: InvestmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inv = db.query(Investment).filter(Investment.id == investment_id, Investment.user_id == current_user.id).first()
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investment record with ID {investment_id} not found"
        )

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            if isinstance(value, str):
                value = value.strip()
            setattr(inv, key, value)

    db.commit()
    db.refresh(inv)
    return format_investment_response(inv)

@router.delete("/{investment_id}", status_code=status.HTTP_200_OK)
def delete_investment(
    investment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inv = db.query(Investment).filter(Investment.id == investment_id, Investment.user_id == current_user.id).first()
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investment record with ID {investment_id} not found"
        )

    db.delete(inv)
    db.commit()
    return {"message": "Investment record deleted successfully", "id": investment_id}
