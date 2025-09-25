from typing import Optional, List
from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime
from sqlalchemy.orm import Mapped, relationship
from datetime import datetime
from sqlalchemy.sql import func
from ..database import Base

class Organization(Base):
    __tablename__ = "organizations"

    # FHIR core fields
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    identifier: Mapped[List[dict]] = Column(JSON, nullable=False)  # e.g., registration numbers
    active: Mapped[bool] = Column(Boolean, default=True)
    type: Mapped[List[dict]] = Column(JSON, nullable=False)  # FHIR-compliant type coding
    name: Mapped[str] = Column(String(length=255), nullable=False)
    alias: Mapped[List[str]] = Column(JSON, nullable=True)
    telecom: Mapped[List[dict]] = Column(JSON, nullable=True)
    address: Mapped[List[dict]] = Column(JSON, nullable=True)
    part_of: Mapped[Optional[dict]] = Column(JSON, nullable=True)
    contact: Mapped[List[dict]] = Column(JSON, nullable=True)
    endpoint: Mapped[List[dict]] = Column(JSON, nullable=True)

    # Extended pharmacy/supplier-specific fields
    organization_type: Mapped[str] = Column(String(length=50), nullable=False)
    license_number: Mapped[str] = Column(String(length=50), nullable=False)
    tax_id: Mapped[str] = Column(String(length=50), nullable=False)
    website: Mapped[Optional[str]] = Column(String(length=255), nullable=True)
    contact_person: Mapped[Optional[str]] = Column(String(length=255), nullable=True)
    payment_terms: Mapped[Optional[str]] = Column(String(length=100), nullable=True)
    description: Mapped[Optional[str]] = Column(String(length=255), nullable=True)

    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    practitioners = relationship("User", back_populates="organization")
    medications = relationship("Medication", back_populates="organization")
    inventory_items = relationship("InventoryItem", back_populates="supplier")
    sales = relationship("Sale", back_populates="organization")
    purchases = relationship("Purchase", back_populates="supplier")

    def __repr__(self):
        return f"<Organization {self.name}>"
