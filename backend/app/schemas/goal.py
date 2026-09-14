from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

class GoalBase(BaseModel):
    goal_name: str = Field(..., min_length=1, max_length=255)
    target_amount: float = Field(..., gt=0)
    current_amount: float = Field(default=0.0, ge=0)
    target_date: str = Field(..., min_length=4, max_length=50)
    description: Optional[str] = Field(default=None, max_length=500)

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    goal_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    target_amount: Optional[float] = Field(default=None, gt=0)
    current_amount: Optional[float] = Field(default=None, ge=0)
    target_date: Optional[str] = Field(default=None, min_length=4, max_length=50)
    description: Optional[str] = Field(default=None, max_length=500)

class GoalResponse(GoalBase):
    id: int
    user_id: int
    progress_percentage: float = 0.0
    remaining_amount: float = 0.0
    is_completed: bool = False
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
