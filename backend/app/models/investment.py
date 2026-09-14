from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Investment(Base):
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    investment_name = Column(String(255), nullable=False)
    investment_type = Column(String(100), nullable=False)
    amount_invested = Column(Float, nullable=False)
    current_value = Column(Float, nullable=False)
    investment_date = Column(String(50), nullable=False) # Format: YYYY-MM-DD
    quantity = Column(Float, nullable=True, default=1.0)
    purchase_price = Column(Float, nullable=True)
    current_price = Column(Float, nullable=True)
    expected_return = Column(Float, nullable=True) # in percentage
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="investments")
