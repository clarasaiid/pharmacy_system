from typing import Optional, List
from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, relationship
from datetime import datetime
from sqlalchemy.sql import func
from ..database import Base

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    # FHIR InventoryItem fields
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    identifier: Mapped[List[dict]] = Column(JSON, nullable=True)  # List of identifiers
    status: Mapped[str] = Column(String(length=50), nullable=False)  # active | inactive | entered-in-error
    medication: Mapped[dict] = Column(JSON, nullable=False)  # Category of the item
    code: Mapped[dict] = Column(JSON, nullable=False)  # SNOMED CT code
    quantity: Mapped[dict] = Column(JSON, nullable=False)  # Current quantity
    characteristic: Mapped[List[dict]] = Column(JSON, nullable=True)  # Additional characteristics
    instance: Mapped[List[dict]] = Column(JSON, nullable=True)  # Specific instances
    stock_quantity: Mapped[int] = Column(Integer, nullable=False, default=0)


    # Pharmacy-specific fields
    fhir_medication_id: Mapped[int] = Column(Integer, ForeignKey("medications.id"), nullable=False)
    batch_number: Mapped[str] = Column(String(length=50), nullable=False)
    expiration_date: Mapped[datetime] = Column(DateTime, nullable=False)
    purchase_date: Mapped[datetime] = Column(DateTime, nullable=False)
    purchase_price: Mapped[float] = Column(Float, nullable=False)
    supplier_id: Mapped[int] = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    medication = relationship("Medication", back_populates="inventory_items")
    supplier = relationship("Organization", back_populates="inventory_items")
    sale_items = relationship("SaleItem", back_populates="inventory_items")
