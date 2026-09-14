from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List

class BudgetBase(BaseModel):
    category: str = Field(..., min_length=1, max_length=100)
    amount: float = Field(..., gt=0)
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000, le=2100)

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    category: Optional[str] = Field(default=None, min_length=1, max_length=100)
    amount: Optional[float] = Field(default=None, gt=0)
    month: Optional[int] = Field(default=None, ge=1, le=12)
    year: Optional[int] = Field(default=None, ge=2000, le=2100)

class BudgetResponse(BudgetBase):
    id: int
    user_id: int
    spent: float = 0.0
    remaining: float = 0.0
    percentage_used: float = 0.0
    status: str = "normal" # "normal", "warning" (>=80%), "exceeded" (>=100%)
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class BudgetStatusResponse(BaseModel):
    total_budgeted: float
    total_spent: float
    total_remaining: float
    budgets: List[BudgetResponse]
