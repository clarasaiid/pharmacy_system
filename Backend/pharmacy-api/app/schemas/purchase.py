from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from .medication import CodeableConcept, Quantity

class Parameter(BaseModel):
    """FHIR SupplyRequest Parameter structure"""
    code: CodeableConcept = Field(..., description="Parameter code")
    value: str = Field(..., description="Parameter value")

class PurchaseItemCreate(BaseModel):
    """FHIR-compliant PurchaseItem creation schema"""
    sequence: int = Field(..., description="Sequence number of item")
    item: CodeableConcept = Field(..., description="Medication details")
    quantity: Quantity = Field(..., description="Quantity details")
    
    # Additional pharmacy-specific fields
    medication_id: int = Field(..., description="Reference to medication")
    quantity_ordered: int = Field(..., description="Quantity ordered")
    quantity_received: int = Field(..., description="Quantity received")
    unit_price: float = Field(..., description="Price per unit")
    total_price: float = Field(..., description="Total price for this item")
    batch_number: str = Field(..., description="Batch number of the medication")
    expiration_date: datetime = Field(..., description="Expiration date of the medication")

class PurchaseCreate(BaseModel):
    """FHIR-compliant Purchase creation schema"""
    status: str = Field(..., description="draft | active | suspended | cancelled | completed | entered-in-error")
    category: CodeableConcept = Field(..., description="Category of supply")
    priority: str = Field(..., description="routine | urgent | asap | stat")
    item: CodeableConcept = Field(..., description="Medication details")
    quantity: Quantity = Field(..., description="Quantity details")
    parameter: Optional[List[Parameter]] = Field(None, description="Additional parameters")
    supplier: dict = Field(..., description="Reference to supplier organization")
    
    # Additional pharmacy-specific fields
    order_date: datetime = Field(..., description="Order date")
    expected_delivery_date: datetime = Field(..., description="Expected delivery date")
    actual_delivery_date: Optional[datetime] = Field(None, description="Actual delivery date")
    total_amount: float = Field(..., description="Total order amount")
    payment_status: str = Field(..., description="paid | pending | cancelled")
    payment_method: str = Field(..., description="Method of payment")
    supplier_id: int = Field(..., description="Reference to supplier organization")
    purchase_items: List[PurchaseItemCreate] = Field(..., description="List of purchase items")

class PurchaseItemOut(PurchaseItemCreate):
    """FHIR-compliant PurchaseItem response schema"""
    id: int
    purchase_id: int

    class Config:
        from_attributes = True

class PurchaseOut(PurchaseCreate):
    """FHIR-compliant Purchase response schema"""
    id: int

    class Config:
        from_attributes = True 