from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class PrescriptionSource(str, Enum):
    ELECTRONIC = "electronic"
    SCANNED = "scanned"
    MANUAL = "manual"

class PrescriptionStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    DISPENSED = "dispensed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"

class DosageInstruction(BaseModel):
    sequence: int
    text: str
    timing: Optional[dict] = None
    route: Optional[dict] = None
    method: Optional[dict] = None
    dose_and_rate: Optional[List[dict]] = None
    max_dose_per_period: Optional[dict] = None
    max_dose_per_administration: Optional[dict] = None
    max_dose_per_lifetime: Optional[dict] = None

class PrescriptionCreate(BaseModel):
    # FHIR MedicationRequest fields
    identifier: List[dict]
    status: str
    intent: str
    category: Optional[List[dict]] = None
    priority: Optional[str] = None
    subject: dict
    encounter: Optional[dict] = None
    authored_on: datetime
    requester: dict
    reason_code: Optional[List[dict]] = None
    dosage_instruction: List[DosageInstruction]
    dispense_request: Optional[dict] = None
    substitution: Optional[dict] = None

    # Pharmacy-specific fields
    prescription_source: PrescriptionSource
    scanned_image_url: Optional[str] = None
    ocr_text: Optional[str] = None
    ocr_confidence: Optional[float] = None

    # Relationships
    patient_id: int
    prescriber_id: int
    medication_id: int  # Database medication ID

    class Config:
        from_attributes = True

class PrescriptionUpdate(BaseModel):
    # FHIR MedicationRequest fields
    identifier: Optional[List[dict]] = None
    status: Optional[str] = None
    intent: Optional[str] = None
    category: Optional[List[dict]] = None
    priority: Optional[str] = None
    subject: Optional[dict] = None
    encounter: Optional[dict] = None
    authored_on: Optional[datetime] = None
    requester: Optional[dict] = None
    reason_code: Optional[List[dict]] = None
    dosage_instruction: Optional[List[DosageInstruction]] = None
    dispense_request: Optional[dict] = None
    substitution: Optional[dict] = None

    # Pharmacy-specific fields
    prescription_source: Optional[PrescriptionSource] = None
    prescription_status: Optional[PrescriptionStatus] = None
    scanned_image_url: Optional[str] = None
    ocr_text: Optional[str] = None
    ocr_confidence: Optional[float] = None
    verification_notes: Optional[str] = None
    verified_by: Optional[int] = None
    verified_at: Optional[datetime] = None

    # Relationships
    patient_id: Optional[int] = None
    prescriber_id: Optional[int] = None
    medication_id: Optional[int] = None

    class Config:
        from_attributes = True

class PrescriptionOut(BaseModel):
    id: int
    identifier: List[dict]
    status: str
    intent: str
    category: Optional[List[dict]]
    priority: Optional[str]
    subject: dict
    encounter: Optional[dict]
    authored_on: datetime
    requester: dict
    reason_code: Optional[List[dict]]
    dosage_instruction: List[DosageInstruction]
    dispense_request: Optional[dict]
    substitution: Optional[dict]

    # Pharmacy-specific fields
    prescription_source: PrescriptionSource
    prescription_status: PrescriptionStatus
    scanned_image_url: Optional[str]
    ocr_text: Optional[str]
    ocr_confidence: Optional[float]
    verification_notes: Optional[str]
    verified_by: Optional[int]
    verified_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    # Relationships
    patient_id: int
    prescriber_id: int
    medication_id: int

    class Config:
        from_attributes = True 