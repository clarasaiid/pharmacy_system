from sqlalchemy import Column, String, Boolean, Date, JSON, ForeignKey, Integer, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum

class DispenseStatus(str, enum.Enum):
    PREPARATION = "preparation"
    IN_PROGRESS = "in-progress"
    CANCELLED = "cancelled"
    ON_HOLD = "on-hold"
    COMPLETED = "completed"
    ENTERED_IN_ERROR = "entered-in-error"
    STOPPED = "stopped"
    DECLINED = "declined"
    UNKNOWN = "unknown"

class MedicationDispense(Base):
    __tablename__ = "medication_dispenses"

    id = Column(Integer, primary_key=True)
    status = Column(Enum(DispenseStatus), nullable=False, default=DispenseStatus.PREPARATION)
    medication_id = Column(Integer, ForeignKey("medications.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    dispenser_id = Column(Integer, ForeignKey("practitioners.id"), nullable=True)
    prescriber_id = Column(Integer, ForeignKey("practitioners.id"), nullable=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    days_supply = Column(Integer, nullable=True)
    when_prepared = Column(DateTime, nullable=True)
    when_handed_over = Column(DateTime, nullable=True)
    dosage_instruction = Column(JSON, nullable=True)
    note = Column(String, nullable=True)
    was_substituted = Column(Boolean, default=False)
    substitution_reason = Column(String, nullable=True)
    substitution_type = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    medication = relationship("Medication", back_populates="dispenses")
    patient = relationship("Patient", back_populates="dispenses")
    dispenser = relationship("User", foreign_keys=[dispenser_id], back_populates="dispensed_medications")
    prescriber = relationship("User", foreign_keys=[prescriber_id], back_populates="prescribed_dispenses")
    prescription = relationship("Prescription", back_populates="dispenses") 