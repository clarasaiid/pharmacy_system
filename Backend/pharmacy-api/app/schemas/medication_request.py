from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MedicationRequestBase(BaseModel):
    patient_id: int
    medication: str
    status: str
    intent: str
    authored_on: Optional[datetime] = None

class MedicationRequestCreate(MedicationRequestBase):
    pass

class MedicationRequestRead(MedicationRequestBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MedicationRequestUpdate(BaseModel):
    patient_id: Optional[int] = None
    medication: Optional[str] = None
    status: Optional[str] = None
    intent: Optional[str] = None
    authored_on: Optional[datetime] = None
