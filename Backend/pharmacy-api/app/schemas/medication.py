from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class CodeableConcept(BaseModel):
    system: str
    value: str
    display: Optional[str]

class MedicationBase(BaseModel):
    resource_type: str = "Medication"
    identifier: Optional[List[dict]] = None
    status: Optional[str] = None
    code: CodeableConcept
    manufacturer: Optional[dict] = None
    form: Optional[dict] = None
    amount: Optional[dict] = None
    ingredient: Optional[List[dict]] = None
    batch: Optional[dict] = None
    note: Optional[str] = None

class MedicationCreate(MedicationBase):
    pass

class MedicationUpdate(MedicationBase):
    pass

class MedicationOut(MedicationBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
class Quantity(BaseModel):
    value: float
    unit: str
    system: str = "http://unitsofmeasure.org"
    code: str
class SNOMEDCode(BaseModel):
    system: str
    code: str
    display: str
