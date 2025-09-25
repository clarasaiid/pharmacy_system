from sqlalchemy import Column, String, Boolean, Date, JSON, ForeignKey, Integer, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base
from app.models.user import User
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

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    status = Column(Enum(DispenseStatus), nullable=False, default=DispenseStatus.PREPARATION)
    medication_id = Column(Integer, ForeignKey("medications.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    dispenser_id = Column(Integer, ForeignKey("practitioners.id"))
    prescriber_id = Column(Integer, ForeignKey("practitioners.id"))
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False)
    
    # Dispensing details
    quantity = Column(Integer, nullable=False)
    days_supply = Column(Integer)
    when_prepared = Column(DateTime)
    when_handed_over = Column(DateTime)
    dosage_instruction = Column(JSON)  # Instructions for taking the medication
    note = Column(String)
    
    # Substitution information
    was_substituted = Column(Boolean, default=False)
    substitution_reason = Column(String)
    substitution_type = Column(String)
    
    # Tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    medication = relationship("Medication", back_populates="dispenses")
    patient = relationship("Patient", back_populates="medication_dispenses")
    prescriber = relationship("User", foreign_keys=[prescriber_id], back_populates="prescribed_dispenses")
    dispenser = relationship("User", foreign_keys=[dispenser_id], back_populates="dispensed_medications")
    prescription = relationship("Prescription", back_populates="dispenses")
    def __repr__(self):
        return f"<MedicationDispense {self.id}>" 