from datetime import datetime
import calendar
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.income import Income
from app.models.expense import Expense
from app.models.investment import Investment
from app.models.budget import Budget
from app.models.goal import FinancialGoal
from app.schemas.analytics import (
    DashboardSummaryResponse, MonthlyBreakdownItem,
    CategorySpendingItem, InvestmentAllocationItem, YearlyFinancialSummary
)
from app.services.insights_service import generate_financial_insights

def get_dashboard_summary(db: Session, user_id: int) -> DashboardSummaryResponse:
    now = datetime.utcnow()
    current_month_str = f"{now.year}-{now.month:02d}"

    # All-time metrics
    all_incomes = db.query(Income).filter(Income.user_id == user_id).all()
    all_expenses = db.query(Expense).filter(Expense.user_id == user_id).all()
    all_investments = db.query(Investment).filter(Investment.user_id == user_id).all()

    total_income = sum(i.amount for i in all_incomes)
    total_expenses = sum(e.amount for e in all_expenses)
    total_investments = sum(inv.amount_invested for inv in all_investments)
    portfolio_value = sum(inv.current_value for inv in all_investments)
    
    # Savings = Income - Expenses - Investments
    total_savings = total_income - total_expenses - total_investments
    total_balance = total_income - total_expenses

    portfolio_profit_loss = portfolio_value - total_investments
    portfolio_return_pct = (portfolio_profit_loss / total_investments * 100) if total_investments > 0 else 0.0

    # Current month metrics
    month_incomes = [i for i in all_incomes if i.date.startswith(current_month_str)]
    month_expenses = [e for e in all_expenses if e.date.startswith(current_month_str)]
    month_investments = [inv for inv in all_investments if inv.investment_date.startswith(current_month_str)]

    monthly_income = sum(i.amount for i in month_incomes)
    monthly_expenses = sum(e.amount for e in month_expenses)
    monthly_investments = sum(inv.amount_invested for inv in month_investments)
    monthly_savings = monthly_income - monthly_expenses - monthly_investments
    savings_rate = (monthly_savings / monthly_income * 100) if monthly_income > 0 else 0.0

    # Budget remaining for current month
    budgets = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.month == now.month,
        Budget.year == now.year
    ).all()
    total_budgeted = sum(b.amount for b in budgets)
    budget_remaining = max(0.0, total_budgeted - monthly_expenses) if total_budgeted > 0 else 0.0

    # Recent transactions (last 6 across income, expenses, investments)
    recent_txs = []
    for inc in sorted(all_incomes, key=lambda x: x.date, reverse=True)[:6]:
        recent_txs.append({
            "id": f"inc-{inc.id}",
            "type": "income",
            "category": inc.category,
            "description": inc.source or inc.description or "Income",
            "amount": inc.amount,
            "date": inc.date,
            "created_at": inc.created_at.isoformat()
        })
    for exp in sorted(all_expenses, key=lambda x: x.date, reverse=True)[:6]:
        recent_txs.append({
            "id": f"exp-{exp.id}",
            "type": "expense",
            "category": exp.category,
            "description": exp.merchant or exp.description or "Expense",
            "amount": exp.amount,
            "date": exp.date,
            "created_at": exp.created_at.isoformat()
        })
    for inv in sorted(all_investments, key=lambda x: x.investment_date, reverse=True)[:6]:
        recent_txs.append({
            "id": f"inv-{inv.id}",
            "type": "investment",
            "category": inv.investment_type,
            "description": inv.investment_name,
            "amount": inv.amount_invested,
            "date": inv.investment_date,
            "created_at": inv.created_at.isoformat()
        })

    # Sort unified recent transactions by date descending
    recent_txs = sorted(recent_txs, key=lambda x: x["date"], reverse=True)[:6]

    insights = generate_financial_insights(db, user_id)

    return DashboardSummaryResponse(
        total_balance=round(total_balance, 2),
        total_income=round(total_income, 2),
        total_expenses=round(total_expenses, 2),
        total_investments=round(total_investments, 2),
        total_savings=round(total_savings, 2),
        monthly_income=round(monthly_income, 2),
        monthly_expenses=round(monthly_expenses, 2),
        monthly_investments=round(monthly_investments, 2),
        monthly_savings=round(monthly_savings, 2),
        savings_rate=round(savings_rate, 2),
        budget_remaining=round(budget_remaining, 2),
        portfolio_value=round(portfolio_value, 2),
        portfolio_profit_loss=round(portfolio_profit_loss, 2),
        portfolio_return_percentage=round(portfolio_return_pct, 2),
        recent_transactions=recent_txs,
        insights=insights
    )

def get_monthly_breakdown(db: Session, user_id: int, year: int) -> List[MonthlyBreakdownItem]:
    breakdown = []
    incomes = db.query(Income).filter(Income.user_id == user_id, Income.date.startswith(str(year))).all()
    expenses = db.query(Expense).filter(Expense.user_id == user_id, Expense.date.startswith(str(year))).all()
    investments = db.query(Investment).filter(Investment.user_id == user_id, Investment.investment_date.startswith(str(year))).all()

    for month_num in range(1, 13):
        m_prefix = f"{year}-{month_num:02d}"
        m_inc = sum(i.amount for i in incomes if i.date.startswith(m_prefix))
        m_exp = sum(e.amount for e in expenses if e.date.startswith(m_prefix))
        m_inv = sum(inv.amount_invested for inv in investments if inv.investment_date.startswith(m_prefix))
        m_savings = m_inc - m_exp - m_inv
        m_savings_rate = (m_savings / m_inc * 100) if m_inc > 0 else 0.0

        breakdown.append(MonthlyBreakdownItem(
            month_name=calendar.month_abbr[month_num],
            month=month_num,
            year=year,
            income=round(m_inc, 2),
            expenses=round(m_exp, 2),
            investments=round(m_inv, 2),
            savings=round(m_savings, 2),
            savings_rate=round(m_savings_rate, 2)
        ))
    return breakdown

def get_category_spending(db: Session, user_id: int, month: int = None, year: int = None) -> List[CategorySpendingItem]:
    query = db.query(Expense).filter(Expense.user_id == user_id)
    if year:
        if month:
            prefix = f"{year}-{month:02d}"
            query = query.filter(Expense.date.startswith(prefix))
        else:
            query = query.filter(Expense.date.startswith(str(year)))

    expenses = query.all()
    total_spent = sum(e.amount for e in expenses)

    cat_map: Dict[str, Dict[str, Any]] = {}
    for exp in expenses:
        if exp.category not in cat_map:
            cat_map[exp.category] = {"amount": 0.0, "count": 0}
        cat_map[exp.category]["amount"] += exp.amount
        cat_map[exp.category]["count"] += 1

    result = []
    for cat, data in cat_map.items():
        pct = (data["amount"] / total_spent * 100) if total_spent > 0 else 0.0
        result.append(CategorySpendingItem(
            category=cat,
            amount=round(data["amount"], 2),
            percentage=round(pct, 2),
            transaction_count=data["count"]
        ))
    
    # Sort descending by amount
    return sorted(result, key=lambda x: x.amount, reverse=True)

def get_yearly_financial_summary(db: Session, user_id: int, year: int) -> YearlyFinancialSummary:
    monthly_data = get_monthly_breakdown(db, user_id, year)
    cat_data = get_category_spending(db, user_id, year=year)

    tot_inc = sum(m.income for m in monthly_data)
    tot_exp = sum(m.expenses for m in monthly_data)
    tot_inv = sum(m.investments for m in monthly_data)
    tot_sav = tot_inc - tot_exp - tot_inv
    net_sav_rate = (tot_sav / tot_inc * 100) if tot_inc > 0 else 0.0

    investments = db.query(Investment).filter(Investment.user_id == user_id).all()
    inv_type_map: Dict[str, Dict[str, float]] = {}
    tot_inv_val = sum(i.current_value for i in investments)

    for inv in investments:
        if inv.investment_type not in inv_type_map:
            inv_type_map[inv.investment_type] = {"invested": 0.0, "current": 0.0}
        inv_type_map[inv.investment_type]["invested"] += inv.amount_invested
        inv_type_map[inv.investment_type]["current"] += inv.current_value

    inv_alloc = []
    for itype, vals in inv_type_map.items():
        pct = (vals["current"] / tot_inv_val * 100) if tot_inv_val > 0 else 0.0
        inv_alloc.append(InvestmentAllocationItem(
            investment_type=itype,
            amount_invested=round(vals["invested"], 2),
            current_value=round(vals["current"], 2),
            percentage=round(pct, 2)
        ))

    return YearlyFinancialSummary(
        year=year,
        total_income=round(tot_inc, 2),
        total_expenses=round(tot_exp, 2),
        total_investments=round(tot_inv, 2),
        total_savings=round(tot_sav, 2),
        net_savings_rate=round(net_sav_rate, 2),
        monthly_breakdown=monthly_data,
        top_expense_categories=cat_data,
        investment_breakdown=inv_alloc
    )
