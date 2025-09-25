from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import date, datetime
import re


class HumanName(BaseModel):
    """FHIR HumanName structure"""
    family: str = Field(..., description="Last name")
    given: List[str] = Field(..., description="First and middle names")

class ContactPoint(BaseModel):
    """FHIR ContactPoint structure"""
    system: str = Field(..., description="phone | email")
    value: str = Field(..., description="The actual contact point details")

class Address(BaseModel):
    """FHIR Address structure"""
    line: List[str] = Field(..., description="Street address lines")
    city: str = Field(..., description="City name")
    country: str = Field(..., description="Country name")

class PatientCreate(BaseModel):
    """FHIR-compliant Patient creation schema"""
    # Name Information (FHIR HumanName)
    name: List[HumanName] = Field(..., description="A name associated with the patient")
    
    # Contact Information (FHIR ContactPoint)
    telecom: List[ContactPoint] = Field(..., description="A contact detail for the patient")
    
    # Address Information (FHIR Address)
    address: List[Address] = Field(..., description="Addresses for the patient")
    
    # Basic Information
    birthDate: date = Field(..., description="The date of birth for the patient")
    
    # Insurance Information
    insurance_company: Optional[str] = Field(None, description="Name of insurance company")
    insurance_number: Optional[str] = Field(None, description="Insurance policy number")

    @validator('birthDate')
    def validate_birth_date(cls, v):
        if v > date.today():
            raise ValueError('Birth date cannot be in the future')
        if v.year < 1900:
            raise ValueError('Birth date seems invalid (before 1900)')
        return v

    @validator('telecom')
    def validate_telecom(cls, v):
        for contact in v:
            if contact.system == "phone":
                # Remove any spaces, dashes, or parentheses
                phone = re.sub(r'[\s\-\(\)]', '', contact.value)
                # Check if it's a valid phone number (international format)
                if not re.match(r'^\+?[1-9]\d{1,14}$', phone):
                    raise ValueError('Invalid phone number format. Must be in international format (e.g., +1234567890)')
                contact.value = phone
        return v

class PatientResponse(BaseModel):
    """FHIR-compliant Patient response schema"""
    id: int
    name: List[Dict[str, Any]] = Field(..., description="Name information in FHIR format")
    telecom: List[Dict[str, Any]] = Field(..., description="Contact information in FHIR format")
    address: List[Dict[str, Any]] = Field(..., description="Address information in FHIR format")
    birthDate: Optional[date] = Field(None, description="Date of birth")
    insurance_company: Optional[str] = Field(None, description="Name of insurance company")
    insurance_number: Optional[str] = Field(None, description="Insurance policy number")

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj):
        if not obj:
            return None
            
        # Convert JSON fields to lists for FHIR compliance
        name_data = obj.name if isinstance(obj.name, list) else [obj.name]
        telecom_data = obj.telecom if isinstance(obj.telecom, list) else [obj.telecom]
        address_data = obj.address if isinstance(obj.address, list) else [obj.address]
        
        return cls(
            id=obj.id,
            name=name_data,
            telecom=telecom_data,
            address=address_data,
            birthDate=obj.birth_date,
            insurance_company=obj.insurance_company,
            insurance_number=obj.insurance_number
        )

class PatientOut(PatientCreate):
    """FHIR-compliant Patient response schema"""
    id: int

    class Config:
        from_attributes = True 