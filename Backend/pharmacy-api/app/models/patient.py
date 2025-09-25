from sqlalchemy import Column, Integer, String, JSON, ForeignKey, Date
from sqlalchemy.orm import relationship
from ..database import Base
from enum import Enum

class Gender(str, Enum):
        male = "male"
        female = "female"

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    
    # Name Information (FHIR HumanName)
    name = Column(JSON)  # Contains family and given names
    
    # Contact Information (FHIR ContactPoint)
    telecom = Column(JSON)  # Contains phone and email contact points
    
    # Address Information (FHIR Address)
    address = Column(JSON)  # Contains address lines, city, and country
    
    # Basic Information
    birth_date = Column(Date)
    
    # Insurance Information
    insurance_company = Column(String, nullable=True)
    insurance_number = Column(String, nullable=True)

    # Relationships
    medication_requests = relationship("MedicationRequest", back_populates="patient")
    prescriptions = relationship("Prescription", back_populates="patient")
    sales = relationship("Sale", back_populates="patient")
    medication_dispenses = relationship("MedicationDispense", back_populates="patient")


