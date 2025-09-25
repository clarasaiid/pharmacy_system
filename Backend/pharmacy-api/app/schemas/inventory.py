from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from .medication import CodeableConcept, Quantity
from typing import Literal  

class Characteristic(BaseModel):
    """FHIR InventoryItem Characteristic structure"""
    code: CodeableConcept = Field(..., description="Characteristic code")
    value: str = Field(..., description="Characteristic value")

class Instance(BaseModel):
    """FHIR InventoryItem Instance structure"""
    identifier: str = Field(..., description="Instance identifier")
    lot_number: Optional[str] = Field(None, description="Lot number")
    expiry: Optional[datetime] = Field(None, description="Expiration date")
    quantity: Optional[Quantity] = Field(None, description="Quantity in this instance")

class InventoryItemCreate(BaseModel):
    """FHIR-compliant InventoryItem creation schema"""
    identifier: Optional[List[dict]] = Field(None, description="FHIR Identifiers for the item")
    status: str = Field(..., description="active | inactive | entered-in-error")
    medication: CodeableConcept = Field(..., description="Category of the item")
    code: CodeableConcept = Field(..., description="SNOMED CT code for the item")
    quantity: Quantity = Field(..., description="Current quantity")
    characteristic: Optional[List[Characteristic]] = Field(None, description="Additional characteristics")
    instance: Optional[List[Instance]] = Field(None, description="Specific instances")
    
    # Additional pharmacy-specific fields
    fhir_medication_id: int = Field(..., description="Reference to medication")
    batch_number: str = Field(..., description="Batch number")
    expiration_date: datetime = Field(..., description="Expiration date")
    purchase_date: datetime = Field(..., description="Purchase date")
    purchase_price: float = Field(..., description="Purchase price")
    supplier_id: int = Field(..., description="Reference to supplier organization")

class InventoryItemOut(InventoryItemCreate):
    """FHIR-compliant InventoryItem response schema"""
    id: int

    class Config:
        from_attributes = True 