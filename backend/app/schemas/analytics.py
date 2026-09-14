from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class FinancialInsight(BaseModel):
    id: str
    type: str # "warning", "success", "info", "tip"
    title: str
    message: str
    icon: Optional[str] = "TrendingUp"

class DashboardSummaryResponse(BaseModel):
    total_balance: float
    total_income: float
    total_expenses: float
    total_investments: float
    total_savings: float
    monthly_income: float
    monthly_expenses: float
    monthly_investments: float
    monthly_savings: float
    savings_rate: float
    budget_remaining: float
    portfolio_value: float
    portfolio_profit_loss: float
    portfolio_return_percentage: float
    recent_transactions: List[Dict[str, Any]]
    insights: List[FinancialInsight]

class MonthlyBreakdownItem(BaseModel):
    month_name: str
    month: int
    year: int
    income: float
    expenses: float
    investments: float
    savings: float
    savings_rate: float

class CategorySpendingItem(BaseModel):
    category: str
    amount: float
    percentage: float
    transaction_count: int

class InvestmentAllocationItem(BaseModel):
    investment_type: str
    amount_invested: float
    current_value: float
    percentage: float

class YearlyFinancialSummary(BaseModel):
    year: int
    total_income: float
    total_expenses: float
    total_investments: float
    total_savings: float
    net_savings_rate: float
    monthly_breakdown: List[MonthlyBreakdownItem]
    top_expense_categories: List[CategorySpendingItem]
    investment_breakdown: List[InvestmentAllocationItem]
