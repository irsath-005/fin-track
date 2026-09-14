from pydantic import BaseModel
from typing import Optional, List

class TransactionItem(BaseModel):
    id: int
    source_id: int # Original ID in income/expense/investment table
    type: str # "income", "expense", "investment"
    category: str
    amount: float
    date: str
    payment_method: str
    description: Optional[str] = None
    merchant: Optional[str] = None
    created_at: str

class TransactionListResponse(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int
    transactions: List[TransactionItem]
