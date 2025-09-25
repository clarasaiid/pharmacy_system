from typing import Optional, List
from sqlalchemy import Boolean, Column, String, DateTime, JSON, Integer, ForeignKey
from sqlalchemy.orm import Mapped, relationship
from datetime import datetime
from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTable
from app.database import Base

class User(SQLAlchemyBaseUserTable[int], Base):
    __tablename__ = "practitioners"

    id: Mapped[int] = Column(Integer, primary_key=True)

    # FHIR Practitioner fields
    identifier: Mapped[List[dict]] = Column(JSON, nullable=False)
    active: Mapped[bool] = Column(Boolean, default=True)
    name: Mapped[List[dict]] = Column(JSON, nullable=False)
    telecom: Mapped[List[dict]] = Column(JSON, nullable=True)
    address: Mapped[List[dict]] = Column(JSON, nullable=True)
    gender: Mapped[Optional[str]] = Column(String(length=10), nullable=True)
    birth_date: Mapped[Optional[datetime]] = Column(DateTime, nullable=True)
    photo: Mapped[List[dict]] = Column(JSON, nullable=True)
    qualification: Mapped[List[dict]] = Column(JSON, nullable=True)
    communication: Mapped[List[dict]] = Column(JSON, nullable=True)

    # Authentication
    username: Mapped[str] = Column(String(length=32), unique=True, index=True, nullable=False)
    reset_password_token: Mapped[Optional[str]] = Column(String(length=255), nullable=True)
    reset_password_token_expires: Mapped[Optional[datetime]] = Column(DateTime, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Organization
    organization_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    organization = relationship("Organization", back_populates="practitioners")

    # Prescriptions
    prescribed_prescriptions = relationship("Prescription", foreign_keys="Prescription.prescriber_id", back_populates="prescriber")
    verified_prescriptions = relationship("Prescription", foreign_keys="Prescription.verified_by", back_populates="verifier")
    prescribed_dispenses = relationship("MedicationDispense", foreign_keys="[MedicationDispense.prescriber_id]", back_populates="prescriber")
    dispensed_medications = relationship("MedicationDispense", foreign_keys="[MedicationDispense.dispenser_id]", back_populates="dispenser")


    def verify_password(self, plain_password: str) -> bool:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.verify(plain_password, self.hashed_password)
