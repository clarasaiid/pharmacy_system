from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel, EmailStr, constr, root_validator, validator
from fastapi_users import schemas


# Base shared schema
class HumanName(BaseModel):
    use: Optional[str] = "official"
    family: str
    given: List[str]


class ContactPoint(BaseModel):
    system: str
    value: str
    use: Optional[str] = "home"


class Address(BaseModel):
    use: Optional[str] = "home"
    text: str


class UserBase(BaseModel):
    name: List[HumanName]
    telecom: List[ContactPoint]
    gender: str
    address: List[Address]
    birth_date: date
    email: EmailStr
    is_active: bool = True
    is_superuser: bool = False
    is_verified: bool = False


# Create schema
class UserCreate(schemas.BaseUserCreate):
    first_name: constr(min_length=1)
    second_name: constr(min_length=1)
    phone_number: constr(min_length=5)
    gender: str
    address: str  # Accept as a simple string from the frontend
    birthdate: date

    @root_validator(pre=True)
    def build_fhir_fields(cls, values):
        # Build FHIR name
        values['name'] = [
            HumanName(family=values['second_name'], given=[values['first_name']]).dict()
        ]
        # Build FHIR telecom
        values['telecom'] = [
            ContactPoint(system="email", value=values['email']).dict(),
            ContactPoint(system="phone", value=values['phone_number']).dict()
        ]
        # Build FHIR address (as array)
        values['fhir_address'] = [Address(text=values['address']).dict()]
        # FHIR birth_date
        values['birth_date'] = values['birthdate']
        return values


# Update schema
class UserUpdate(BaseModel):
    first_name: Optional[str]
    second_name: Optional[str]
    email: Optional[EmailStr]
    password: Optional[str]
    phone_number: Optional[str]
    gender: Optional[str]
    address: Optional[str]
    birthdate: Optional[date]


# Output schema
class UserOut(UserBase, schemas.BaseUser[int]):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


# Optional extended schema for profiles
class UserProfile(UserOut):
    organization_id: Optional[int] = None
    reset_password_token: Optional[str] = None
    reset_password_token_expires: Optional[datetime] = None


# Minimal read schema for login/token view
class UserRead(BaseModel):
    id: int
    name: List[HumanName]
    telecom: List[ContactPoint]
    gender: str
    address: List[Address]  # FHIR compatible output
    birth_date: date
    email: EmailStr
    is_active: bool
    is_superuser: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


# Token schema
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class VerificationRequest(BaseModel):
    email: EmailStr
    password: constr(min_length=8)
