from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True)
    date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Foreign key to Organization
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    organization = relationship("Organization", back_populates="sales")

    # Customer info (walk-in or registered patient)
    customer_name = Column(String, nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)

    payment_method = Column(String)
    payment_status = Column(String)
    total_amount = Column(Float)
    status = Column(String)  # e.g. draft, issued, completed, cancelled

    # Relationships
    patient = relationship("Patient", back_populates="sales")
    sale_items = relationship("SaleItem", back_populates="sale")


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sequence = Column(Integer)
    charge_item = Column(JSON)  # Billing-related details
    price_component = Column(JSON)  # Discounts, taxes, etc.

    sale_id = Column(Integer, ForeignKey("sales.id"))
    medication_id = Column(Integer, ForeignKey("medications.id"))
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)

    quantity = Column(Integer)
    unit_price = Column(Float)
    total_price = Column(Float)

    # Relationships
    sale = relationship("Sale", back_populates="sale_items")
    medication = relationship("Medication", back_populates="sale_items")
    organization = relationship("Organization")  # Optional, if each item can have different org
    inventory_items = relationship("InventoryItem", back_populates="sale_items")
