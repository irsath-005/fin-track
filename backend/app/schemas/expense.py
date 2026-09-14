from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

class ExpenseBase(BaseModel):
    amount: float = Field(..., gt=0)
    category: str = Field(..., min_length=1, max_length=100)
    date: str = Field(..., min_length=4, max_length=50)
    payment_method: str = Field(default="Credit Card", max_length=100)
    merchant: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = Field(default=None, max_length=500)
    notes: Optional[str] = Field(default=None, max_length=500)

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    amount: Optional[float] = Field(default=None, gt=0)
    category: Optional[str] = Field(default=None, min_length=1, max_length=100)
    date: Optional[str] = Field(default=None, min_length=4, max_length=50)
    payment_method: Optional[str] = Field(default=None, max_length=100)
    merchant: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = Field(default=None, max_length=500)
    notes: Optional[str] = Field(default=None, max_length=500)

class ExpenseResponse(ExpenseBase):
    id: int
    user_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
