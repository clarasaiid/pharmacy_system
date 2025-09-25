from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class SaleItemCreate(BaseModel):
    sequence: int
    charge_item: Dict
    price_component: Optional[Dict] = None
    quantity: int
    unit_price: float
    total_price: float
    medication_id: Optional[int] = None
    inventory_item_id: Optional[int] = None

class SaleCreate(BaseModel):
    patient_id: Optional[int] = None
    patient_phone: Optional[str] = None
    customer_name: Optional[str] = None
    payment_method: str
    payment_status: str
    date: Optional[datetime] = None
    status: str
    sale_items: List[SaleItemCreate]

class SaleItemResponse(SaleItemCreate):
    id: int
    class Config:
        from_attributes = True

class SaleResponse(BaseModel):
    id: int
    invoice_number: str
    total_amount: float
    created_at: datetime
    payment_method: str
    payment_status: str
    customer_name: Optional[str] = None
    sale_items: List[SaleItemResponse]

    class Config:
        from_attributes = True
