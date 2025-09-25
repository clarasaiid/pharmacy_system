from typing import Optional, List
from sqlalchemy import Column, Integer, String, Float, JSON, DateTime
from sqlalchemy.orm import Mapped
from datetime import datetime
from ..database import Base

class MedicineDatabase(Base):
    __tablename__ = "medicine_database"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    name: Mapped[str] = Column(String, nullable=False, index=True)
    active_ingredient: Mapped[str] = Column(String, nullable=True)
    category: Mapped[str] = Column(String, nullable=True)
    price: Mapped[float] = Column(Float, nullable=True)
    manufacturer: Mapped[str] = Column(String, nullable=True)
    dosage_form: Mapped[str] = Column(String, nullable=True)
    effects: Mapped[str] = Column(String, nullable=True)
    ai_classification: Mapped[dict] = Column(JSON, nullable=True)  # Store AI classification results
    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = Column(DateTime, onupdate=datetime.utcnow) 