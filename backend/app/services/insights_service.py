from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.income import Income
from app.models.expense import Expense
from app.models.investment import Investment
from app.models.budget import Budget
from app.schemas.analytics import FinancialInsight

def generate_financial_insights(db: Session, user_id: int) -> List[FinancialInsight]:
    insights: List[FinancialInsight] = []
    now = datetime.utcnow()
    current_month_str = f"{now.year}-{now.month:02d}"
    
    # Calculate previous month string
    prev_year = now.year if now.month > 1 else now.year - 1
    prev_month = now.month - 1 if now.month > 1 else 12
    prev_month_str = f"{prev_year}:{prev_month:02d}" # or formatted as YYYY-MM
    prev_month_pattern = f"{prev_year}-{prev_month:02d}"

    # 1. Total monthly income vs expense
    current_incomes = db.query(Income).filter(Income.user_id == user_id, Income.date.startswith(current_month_str)).all()
    current_expenses = db.query(Expense).filter(Expense.user_id == user_id, Expense.date.startswith(current_month_str)).all()
    
    total_curr_income = sum(i.amount for i in current_incomes)
    total_curr_expense = sum(e.amount for e in current_expenses)

    # Previous month expenses
    prev_expenses = db.query(Expense).filter(Expense.user_id == user_id, Expense.date.startswith(prev_month_pattern)).all()
    total_prev_expense = sum(e.amount for e in prev_expenses)

    # Insight: Savings Rate
    if total_curr_income > 0:
        savings = total_curr_income - total_curr_expense
        savings_rate = (savings / total_curr_income) * 100
        if savings_rate >= 30:
            insights.append(FinancialInsight(
                id="high_savings_rate",
                type="success",
                title="Superb Savings Rate",
                message=f"You have saved {savings_rate:.1f}% of your monthly income! Excellent financial discipline.",
                icon="Award"
            ))
        elif savings_rate > 0:
            insights.append(FinancialInsight(
                id="positive_savings_rate",
                type="info",
                title="Positive Monthly Savings",
                message=f"You saved {savings_rate:.1f}% of your income this month.",
                icon="PiggyBank"
            ))
        else:
            insights.append(FinancialInsight(
                id="negative_savings",
                type="warning",
                title="Expenses Exceed Income",
                message=f"Your expenses are exceeding your income by ${abs(savings):,.2f} this month. Review non-essential spending.",
                icon="AlertTriangle"
            ))

    # Insight: Month-over-Month Expense Change
    if total_prev_expense > 0 and total_curr_expense > 0:
        change_pct = ((total_curr_expense - total_prev_expense) / total_prev_expense) * 100
        if change_pct > 15:
            insights.append(FinancialInsight(
                id="expense_increase",
                type="warning",
                title="Spending Increased",
                message=f"Total spending increased by {change_pct:.1f}% compared to last month.",
                icon="TrendingUp"
            ))
        elif change_pct < -10:
            insights.append(FinancialInsight(
                id="expense_decrease",
                type="success",
                title="Spending Under Control",
                message=f"Your spending is down by {abs(change_pct):.1f}% compared to last month. Great job cutting costs!",
                icon="TrendingDown"
            ))

    # Insight: Highest Spending Category this month
    category_totals: Dict[str, float] = {}
    for exp in current_expenses:
        category_totals[exp.category] = category_totals.get(exp.category, 0.0) + exp.amount

    if category_totals:
        top_cat = max(category_totals.items(), key=lambda x: x[1])
        cat_pct = (top_cat[1] / total_curr_expense) * 100 if total_curr_expense > 0 else 0
        insights.append(FinancialInsight(
            id="top_spending_category",
            type="info",
            title="Top Spending Category",
            message=f"Your highest spending category is {top_cat[0]} at ${top_cat[1]:,.2f} ({cat_pct:.1f}% of monthly expenses).",
            icon="PieChart"
        ))

    # Insight: Budget status checks
    budgets = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.month == now.month,
        Budget.year == now.year
    ).all()

    for b in budgets:
        spent = category_totals.get(b.category, 0.0)
        pct = (spent / b.amount) * 100 if b.amount > 0 else 0
        if pct >= 100:
            insights.append(FinancialInsight(
                id=f"budget_exceeded_{b.id}",
                type="warning",
                title="Budget Exceeded",
                message=f"You have exceeded your {b.category} budget by ${(spent - b.amount):,.2f} ({pct:.0f}% used).",
                icon="AlertCircle"
            ))
        elif pct >= 80:
            insights.append(FinancialInsight(
                id=f"budget_warning_{b.id}",
                type="warning",
                title="Budget Warning",
                message=f"You have used {pct:.1f}% of your {b.category} budget (${spent:,.2f} of ${b.amount:,.2f}).",
                icon="AlertTriangle"
            ))

    # Insight: Investments return check
    investments = db.query(Investment).filter(Investment.user_id == user_id).all()
    if investments:
        total_inv = sum(inv.amount_invested for inv in investments)
        total_val = sum(inv.current_value for inv in investments)
        if total_inv > 0:
            total_gain = total_val - total_inv
            gain_pct = (total_gain / total_inv) * 100
            if gain_pct > 0:
                insights.append(FinancialInsight(
                    id="investment_gain",
                    type="success",
                    title="Portfolio Growth",
                    message=f"Your investment portfolio is up +{gain_pct:.1f}% with an overall unrealized gain of ${total_gain:,.2f}.",
                    icon="TrendingUp"
                ))
            elif gain_pct < 0:
                insights.append(FinancialInsight(
                    id="investment_loss",
                    type="info",
                    title="Portfolio Performance",
                    message=f"Your investment portfolio is down {gain_pct:.1f}% (${abs(total_gain):,.2f} loss). Stay focused on long-term horizon.",
                    icon="Activity"
                ))

    # If no data yet, provide a welcoming getting-started insight
    if not insights:
        insights.append(FinancialInsight(
            id="welcome_insight",
            type="tip",
            title="Getting Started with FinTrack",
            message="Add your first income, expense, or investment to unlock automated analytics and AI financial insights!",
            icon="Lightbulb"
        ))

    return insights
