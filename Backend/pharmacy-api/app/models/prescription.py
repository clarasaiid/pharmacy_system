from typing import Optional, List
from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime, ForeignKey, Float, Enum
from sqlalchemy.orm import Mapped, relationship
from datetime import datetime
from sqlalchemy.sql import func
import enum
from ..database import Base

class PrescriptionSource(enum.Enum):
    ELECTRONIC = "electronic"
    SCANNED = "scanned"
    MANUAL = "manual"

class PrescriptionStatus(enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    DISPENSED = "dispensed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"

class Prescription(Base):
    __tablename__ = "prescriptions"

    # FHIR MedicationRequest fields
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    identifier: Mapped[List[dict]] = Column(JSON, nullable=False)  # List of identifiers
    status: Mapped[str] = Column(String(length=50), nullable=False)  # active | on-hold | cancelled | completed | entered-in-error | stopped | draft | unknown
    intent: Mapped[str] = Column(String(length=50), nullable=False)  # proposal | plan | order | original-order | reflex-order | filler-order | instance-order | option
    category: Mapped[List[dict]] = Column(JSON, nullable=True)  # Category of medication request
    priority: Mapped[str] = Column(String(length=50), nullable=True)  # routine | urgent | asap | stat
    subject: Mapped[dict] = Column(JSON, nullable=False)  # Reference to patient
    encounter: Mapped[Optional[dict]] = Column(JSON, nullable=True)  # Reference to encounter
    authored_on: Mapped[datetime] = Column(DateTime, nullable=False)
    requester: Mapped[dict] = Column(JSON, nullable=False)  # Reference to practitioner
    reason_code: Mapped[List[dict]] = Column(JSON, nullable=True)  # Reason for prescription
    dosage_instruction: Mapped[List[dict]] = Column(JSON, nullable=False)  # Dosage instructions
    dispense_request: Mapped[Optional[dict]] = Column(JSON, nullable=True)  # Dispense request details
    substitution: Mapped[Optional[dict]] = Column(JSON, nullable=True)  # Substitution instructions

    # Pharmacy-specific fields
    prescription_source: Mapped[PrescriptionSource] = Column(Enum(PrescriptionSource), nullable=False)
    prescription_status: Mapped[PrescriptionStatus] = Column(Enum(PrescriptionStatus), nullable=False, default=PrescriptionStatus.PENDING)
    scanned_image_url: Mapped[Optional[str]] = Column(String(length=255), nullable=True)  # URL to stored scanned prescription
    ocr_text: Mapped[Optional[str]] = Column(String(length=1000), nullable=True)  # Extracted text from OCR
    ocr_confidence: Mapped[Optional[float]] = Column(Float, nullable=True)  # OCR confidence score
    verification_notes: Mapped[Optional[str]] = Column(String(length=500), nullable=True)
    verified_by: Mapped[Optional[int]] = Column(Integer, ForeignKey("practitioners.id"), nullable=True)
    verified_at: Mapped[Optional[datetime]] = Column(DateTime, nullable=True)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    patient_id: Mapped[int] = Column(Integer, ForeignKey("patients.id"), nullable=False)
    prescriber_id: Mapped[int] = Column(Integer, ForeignKey("practitioners.id"), nullable=False)
    medication_id: Mapped[int] = Column(Integer, ForeignKey("medications.id"), nullable=False)
    
    patient = relationship("Patient", back_populates="prescriptions")
    prescriber = relationship("User", foreign_keys=[prescriber_id], back_populates="prescribed_prescriptions")
    verifier = relationship("User", foreign_keys=[verified_by], back_populates="verified_prescriptions")
    medication = relationship("Medication", back_populates="prescriptions")
    dispenses = relationship("MedicationDispense", back_populates="prescription") 
    