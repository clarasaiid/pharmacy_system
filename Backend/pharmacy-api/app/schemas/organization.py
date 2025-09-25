from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List

class Identifier(BaseModel):
    """FHIR Identifier structure"""
    use: Optional[str] = Field(None, description="usual | official | temp | secondary | old")
    system: str = Field(..., description="The namespace for the identifier")
    value: str = Field(..., description="The value that is unique")

class ContactPoint(BaseModel):
    """FHIR ContactPoint structure"""
    system: str = Field(..., description="phone | email | fax | pager | url | sms | other")
    value: str = Field(..., description="The actual contact point details")
    use: Optional[str] = Field(None, description="home | work | temp | old | mobile")
    rank: Optional[int] = Field(None, description="Specify preferred order of use (1 = highest)")

class Address(BaseModel):
    """FHIR Address structure"""
    use: Optional[str] = Field(None, description="home | work | temp | old | billing")
    type: Optional[str] = Field(None, description="postal | physical | both")
    text: Optional[str] = Field(None, description="Text representation of the address")
    line: List[str] = Field(..., description="Street name, number, direction & P.O. Box etc.")
    city: str = Field(..., description="Name of city, town etc.")
    state: Optional[str] = Field(None, description="Sub-unit of country")
    postalCode: Optional[str] = Field(None, description="Postal code for area")
    country: str = Field(..., description="Country")

class OrganizationCreate(BaseModel):
    """FHIR-compliant Organization creation schema"""
    identifier: List[Identifier] = Field(..., description="List of identifiers")
    active: bool = Field(True, description="Whether this organization's record is still in active use")
    type: List[dict] = Field(..., description="List of organization types")
    name: str = Field(..., description="Name used for the organization")
    alias: Optional[List[str]] = Field(None, description="List of alternative names")
    telecom: List[ContactPoint] = Field(..., description="Contact points")
    address: List[Address] = Field(..., description="Addresses for the organization")
    part_of: Optional[dict] = Field(None, description="Reference to parent organization")
    
    # Additional pharmacy-specific fields
    organization_type: str = Field(..., description="manufacturer | distributor | pharmacy")
    license_number: str = Field(..., description="Organization license number")
    tax_id: str = Field(..., description="Tax identification number")

class OrganizationOut(OrganizationCreate):
    """FHIR-compliant Organization response schema"""
    id: int

    class Config:
        from_attributes = True 