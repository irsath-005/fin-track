from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import math
from app.database import get_db
from app.models.user import User
from app.models.income import Income
from app.models.expense import Expense
from app.models.investment import Investment
from app.schemas.transaction import TransactionItem, TransactionListResponse
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("", response_model=TransactionListResponse)
def get_unified_transactions(
    type: Optional[str] = None, # "income", "expense", "investment"
    category: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("date", pattern="^(date|amount|category|type)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items: List[TransactionItem] = []

    # Gather Incomes if not filtered out
    if type is None or type == "income":
        inc_q = db.query(Income).filter(Income.user_id == current_user.id)
        if category:
            inc_q = inc_q.filter(Income.category == category)
        if start_date:
            inc_q = inc_q.filter(Income.date >= start_date)
        if end_date:
            inc_q = inc_q.filter(Income.date <= end_date)
        if search:
            s_pat = f"%{search}%"
            inc_q = inc_q.filter(
                (Income.source.ilike(s_pat)) |
                (Income.description.ilike(s_pat)) |
                (Income.category.ilike(s_pat))
            )
        for inc in inc_q.all():
            items.append(TransactionItem(
                id=inc.id,
                source_id=inc.id,
                type="income",
                category=inc.category,
                amount=inc.amount,
                date=inc.date,
                payment_method=inc.payment_method,
                description=inc.source + (f" - {inc.description}" if inc.description else ""),
                merchant=None,
                created_at=inc.created_at.isoformat()
            ))

    # Gather Expenses if not filtered out
    if type is None or type == "expense":
        exp_q = db.query(Expense).filter(Expense.user_id == current_user.id)
        if category:
            exp_q = exp_q.filter(Expense.category == category)
        if start_date:
            exp_q = exp_q.filter(Expense.date >= start_date)
        if end_date:
            exp_q = exp_q.filter(Expense.date <= end_date)
        if search:
            s_pat = f"%{search}%"
            exp_q = exp_q.filter(
                (Expense.category.ilike(s_pat)) |
                (Expense.merchant.ilike(s_pat)) |
                (Expense.description.ilike(s_pat))
            )
        for exp in exp_q.all():
            desc_text = exp.merchant or exp.description or "Expense"
            if exp.description and exp.merchant and exp.description != exp.merchant:
                desc_text = f"{exp.merchant} ({exp.description})"
            items.append(TransactionItem(
                id=exp.id,
                source_id=exp.id,
                type="expense",
                category=exp.category,
                amount=exp.amount,
                date=exp.date,
                payment_method=exp.payment_method,
                description=desc_text,
                merchant=exp.merchant,
                created_at=exp.created_at.isoformat()
            ))

    # Gather Investments if not filtered out
    if type is None or type == "investment":
        inv_q = db.query(Investment).filter(Investment.user_id == current_user.id)
        if category:
            inv_q = inv_q.filter(Investment.investment_type == category)
        if start_date:
            inv_q = inv_q.filter(Investment.investment_date >= start_date)
        if end_date:
            inv_q = inv_q.filter(Investment.investment_date <= end_date)
        if search:
            s_pat = f"%{search}%"
            inv_q = inv_q.filter(
                (Investment.investment_name.ilike(s_pat)) |
                (Investment.investment_type.ilike(s_pat))
            )
        for inv in inv_q.all():
            items.append(TransactionItem(
                id=inv.id,
                source_id=inv.id,
                type="investment",
                category=inv.investment_type,
                amount=inv.amount_invested,
                date=inv.investment_date,
                payment_method="Portfolio / Demat",
                description=inv.investment_name,
                merchant=None,
                created_at=inv.created_at.isoformat()
            ))

    # Sorting
    reverse_flag = (sort_order == "desc")
    if sort_by == "date":
        items = sorted(items, key=lambda x: x.date, reverse=reverse_flag)
    elif sort_by == "amount":
        items = sorted(items, key=lambda x: x.amount, reverse=reverse_flag)
    elif sort_by == "category":
        items = sorted(items, key=lambda x: x.category.lower(), reverse=reverse_flag)
    elif sort_by == "type":
        items = sorted(items, key=lambda x: x.type.lower(), reverse=reverse_flag)

    total_count = len(items)
    total_pages = math.ceil(total_count / limit) if total_count > 0 else 1
    start_idx = (page - 1) * limit
    paginated_items = items[start_idx : start_idx + limit]

    return TransactionListResponse(
        total=total_count,
        page=page,
        limit=limit,
        total_pages=total_pages,
        transactions=paginated_items
    )
