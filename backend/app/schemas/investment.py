from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

class InvestmentBase(BaseModel):
    investment_name: str = Field(..., min_length=1, max_length=255)
    investment_type: str = Field(..., min_length=1, max_length=100)
    amount_invested: float = Field(..., gt=0)
    current_value: float = Field(..., ge=0)
    investment_date: str = Field(..., min_length=4, max_length=50)
    quantity: Optional[float] = Field(default=1.0, gt=0)
    purchase_price: Optional[float] = Field(default=None, ge=0)
    current_price: Optional[float] = Field(default=None, ge=0)
    expected_return: Optional[float] = Field(default=None) # Percentage
    notes: Optional[str] = Field(default=None, max_length=500)

class InvestmentCreate(InvestmentBase):
    pass

class InvestmentUpdate(BaseModel):
    investment_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    investment_type: Optional[str] = Field(default=None, min_length=1, max_length=100)
    amount_invested: Optional[float] = Field(default=None, gt=0)
    current_value: Optional[float] = Field(default=None, ge=0)
    investment_date: Optional[str] = Field(default=None, min_length=4, max_length=50)
    quantity: Optional[float] = Field(default=None, gt=0)
    purchase_price: Optional[float] = Field(default=None, ge=0)
    current_price: Optional[float] = Field(default=None, ge=0)
    expected_return: Optional[float] = Field(default=None)
    notes: Optional[str] = Field(default=None, max_length=500)

class InvestmentResponse(InvestmentBase):
    id: int
    user_id: int
    profit_loss: float
    return_percentage: float
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class InvestmentSummary(BaseModel):
    total_invested: float
    current_portfolio_value: float
    total_profit_loss: float
    total_return_percentage: float
