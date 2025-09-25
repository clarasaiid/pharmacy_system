from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from ..database import Base

class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)
    
    # FHIR SupplyRequest structure
    status = Column(String)  # draft | active | suspended | cancelled | completed | entered-in-error
    category = Column(JSON)  # Category of supply
    priority = Column(String)  # routine | urgent | asap | stat
    item = Column(JSON)  # Medication details
    quantity = Column(JSON)  # Contains value and unit
    parameter = Column(JSON)  # Additional parameters
    supplier = Column(JSON)  # Reference to supplier organization
    
    # Additional pharmacy-specific fields
    order_date = Column(DateTime)
    expected_delivery_date = Column(DateTime)
    actual_delivery_date = Column(DateTime)
    total_amount = Column(Float)
    payment_status = Column(String)  # paid | pending | cancelled
    payment_method = Column(String)
    supplier_id = Column(Integer, ForeignKey("organizations.id"))
    
    # Relationships
    supplier = relationship("Organization", back_populates="purchases")
    purchase_items = relationship("PurchaseItem", back_populates="purchase")

class PurchaseItem(Base):
    __tablename__ = "purchase_items"

    id = Column(Integer, primary_key=True, index=True)
    
    # FHIR SupplyRequest Item structure
    sequence = Column(Integer)
    item = Column(JSON)  # Medication details
    quantity = Column(JSON)  # Contains value and unit
    
    # Additional pharmacy-specific fields
    purchase_id = Column(Integer, ForeignKey("purchases.id"))
    medication_id = Column(Integer, ForeignKey("medications.id"))
    quantity_ordered = Column(Integer)
    quantity_received = Column(Integer)
    unit_price = Column(Float)
    total_price = Column(Float)
    batch_number = Column(String)  # Batch number of the medication
    expiration_date = Column(DateTime)  # Expiration date of the medication
    
    # Relationships
    purchase = relationship("Purchase", back_populates="purchase_items")
    medication = relationship("Medication") 