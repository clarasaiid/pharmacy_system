from fhir.resources.patient import Patient
from fhir.resources.humanname import HumanName
from fhir.resources.contactpoint import ContactPoint
from fhir.resources.address import Address
from fhir.resources.codeableconcept import CodeableConcept
from fhir.resources.coding import Coding
from fhir.resources.extension import Extension
from typing import Optional, List, Dict
from datetime import date
from pydantic import BaseModel, EmailStr

class PatientResource(BaseModel):
    """FHIR Patient resource with comprehensive attributes"""
    
    @staticmethod
    def create_patient(
        # Basic Information
        identifier: List[Dict[str, str]],
        active: bool = True,
        
        # Name Information
        family_name: str,
        given_names: List[str],
        prefix: Optional[List[str]] = None,
        suffix: Optional[List[str]] = None,
        
        # Contact Information
        telecom: Optional[List[Dict[str, str]]] = None,  # phone, email, etc.
        address: Optional[List[Dict[str, str]]] = None,
        
        # Demographics
        gender: Optional[str] = None,  # male | female | other | unknown
        birth_date: Optional[date] = None,
        deceased: Optional[bool] = None,
        deceased_date: Optional[date] = None,
        
        # Medical Information
        marital_status: Optional[Dict[str, str]] = None,
        multiple_birth: Optional[bool] = None,
        multiple_birth_integer: Optional[int] = None,
        
        # Communication
        communication: Optional[List[Dict[str, str]]] = None,
        
        # Contact Persons
        contact: Optional[List[Dict[str, str]]] = None,
        
        # General Practitioner
        general_practitioner: Optional[List[str]] = None,
        
        # Managing Organization
        managing_organization: Optional[str] = None,
        
        # Links to other patients
        link: Optional[List[Dict[str, str]]] = None,
        
        # Custom Extensions
        extensions: Optional[List[Dict[str, str]]] = None
    ) -> Patient:
        """
        Create a FHIR Patient resource
        
        Args:
            identifier: List of identifiers (e.g., MRN, insurance numbers)
            active: Whether the patient record is active
            family_name: Patient's family name
            given_names: List of given names
            prefix: List of name prefixes (e.g., Mr., Mrs.)
            suffix: List of name suffixes (e.g., Jr., Sr.)
            telecom: List of contact points (phone, email)
            address: List of addresses
            gender: Patient's gender
            birth_date: Date of birth
            deceased: Whether the patient is deceased
            deceased_date: Date of death if deceased
            marital_status: Marital status with coding
            multiple_birth: Whether patient is part of multiple birth
            multiple_birth_integer: Number in multiple birth
            communication: List of communication preferences
            contact: List of contact persons
            general_practitioner: List of general practitioner references
            managing_organization: Reference to managing organization
            link: List of links to other patient records
            extensions: List of custom extensions
        """
        
        # Create name
        name = HumanName(
            family=family_name,
            given=given_names,
            prefix=prefix,
            suffix=suffix
        )
        
        # Create telecom (contact points)
        telecom_list = []
        if telecom:
            for t in telecom:
                telecom_list.append(
                    ContactPoint(
                        system=t.get("system"),  # phone | fax | email | pager | url | sms | other
                        value=t.get("value"),
                        use=t.get("use")  # home | work | temp | old | mobile
                    )
                )
        
        # Create addresses
        address_list = []
        if address:
            for addr in address:
                address_list.append(
                    Address(
                        use=addr.get("use"),  # home | work | temp | old | billing
                        type=addr.get("type"),  # postal | physical | both
                        text=addr.get("text"),
                        line=addr.get("line", []),
                        city=addr.get("city"),
                        district=addr.get("district"),
                        state=addr.get("state"),
                        postalCode=addr.get("postalCode"),
                        country=addr.get("country")
                    )
                )
        
        # Create marital status
        marital_status_obj = None
        if marital_status:
            coding = Coding(
                system=marital_status.get("system", "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus"),
                code=marital_status.get("code"),
                display=marital_status.get("display")
            )
            marital_status_obj = CodeableConcept(
                coding=[coding],
                text=marital_status.get("text")
            )
        
        # Create communication preferences
        communication_list = []
        if communication:
            for comm in communication:
                coding = Coding(
                    system=comm.get("system", "urn:ietf:bcp:47"),
                    code=comm.get("code"),
                    display=comm.get("display")
                )
                communication_list.append({
                    "language": CodeableConcept(
                        coding=[coding],
                        text=comm.get("text")
                    ),
                    "preferred": comm.get("preferred", False)
                })
        
        # Create patient resource
        patient = Patient(
            identifier=identifier,
            active=active,
            name=[name],
            telecom=telecom_list,
            address=address_list,
            gender=gender,
            birthDate=birth_date.isoformat() if birth_date else None,
            deceasedBoolean=deceased,
            deceasedDateTime=deceased_date.isoformat() if deceased_date else None,
            maritalStatus=marital_status_obj,
            multipleBirthBoolean=multiple_birth,
            multipleBirthInteger=multiple_birth_integer,
            communication=communication_list,
            contact=contact,
            generalPractitioner=[{"reference": ref} for ref in general_practitioner] if general_practitioner else None,
            managingOrganization={"reference": managing_organization} if managing_organization else None,
            link=link
        )
        
        # Add custom extensions if provided
        if extensions:
            patient.extension = [
                Extension(
                    url=ext.get("url"),
                    valueString=ext.get("value")
                ) for ext in extensions
            ]
        
        return patient 