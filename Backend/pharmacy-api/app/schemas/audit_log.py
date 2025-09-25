from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AuditLogCreate(BaseModel):
    action: str
    inventory_item_id: Optional[int] = None
    quantity_changed: int
    performed_by: str
    details: Optional[dict] = None

class AuditLogResponse(AuditLogCreate):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True
