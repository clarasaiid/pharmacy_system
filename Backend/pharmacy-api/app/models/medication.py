from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base
from datetime import datetime

class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    resource_type = Column(String, default="Medication")
    identifier = Column(JSON, nullable=True)
    status = Column(String, nullable=True)
    code_system = Column(String, nullable=False)
    code_value = Column(String, nullable=False)
    code_display = Column(String, nullable=True)
    manufacturer = Column(JSON, nullable=True)
    form = Column(JSON, nullable=True)
    amount = Column(JSON, nullable=True)
    ingredient = Column(JSON, nullable=True)
    batch = Column(JSON, nullable=True)
    note = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sale_items = relationship("SaleItem", back_populates="medication")
    prescriptions = relationship("Prescription", back_populates="medication")
    dispenses = relationship("MedicationDispense", back_populates="medication")
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    organization = relationship("Organization", back_populates="medications")
    inventory_items = relationship("InventoryItem", back_populates="medication")