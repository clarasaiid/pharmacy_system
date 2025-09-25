from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from app.models.medication_dispenses import DispenseStatus

class DosageInstruction(BaseModel):
    text: str
    timing: Optional[Dict[str, Any]] = None
    route: Optional[str] = None
    method: Optional[str] = None
    dose: Optional[Dict[str, Any]] = None
    rate: Optional[Dict[str, Any]] = None
    max_dose_per_period: Optional[Dict[str, Any]] = None

class MedicationDispenseBase(BaseModel):
    medication_id: str
    patient_id: str
    prescriber_id: str
    dispenser_id: str
    prescription_id: str
    quantity: int = Field(..., gt=0)
    days_supply: Optional[int] = Field(None, gt=0)
    dosage_instruction: Optional[DosageInstruction] = None
    note: Optional[str] = None
    was_substituted: bool = False
    substitution_reason: Optional[str] = None
    substitution_type: Optional[str] = None

class MedicationDispenseCreate(MedicationDispenseBase):
    pass

class MedicationDispenseUpdate(BaseModel):
    status: Optional[DispenseStatus] = None
    quantity: Optional[int] = Field(None, gt=0)
    days_supply: Optional[int] = Field(None, gt=0)
    when_prepared: Optional[datetime] = None
    when_handed_over: Optional[datetime] = None
    dosage_instruction: Optional[DosageInstruction] = None
    note: Optional[str] = None
    was_substituted: Optional[bool] = None
    substitution_reason: Optional[str] = None
    substitution_type: Optional[str] = None

class MedicationDispenseResponse(MedicationDispenseBase):
    id: str
    status: DispenseStatus
    when_prepared: Optional[datetime] = None
    when_handed_over: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True