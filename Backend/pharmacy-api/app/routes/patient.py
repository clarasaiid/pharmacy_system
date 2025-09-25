from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from sqlalchemy import select, cast, String
from sqlalchemy.dialects.postgresql import JSONB

from ..database import get_db
from ..models.patient import Patient
from ..schemas.patient import PatientCreate, PatientResponse, HumanName, ContactPoint, Address

router = APIRouter(prefix="/fhir/Patient", tags=["Patient"])

@router.post("/", response_model=PatientResponse)
async def create_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    """Create a new patient record"""
    try:
        # Create database record
        db_patient = Patient(
            name=[n.dict() for n in patient.name],  # Store all name entries as a list
            telecom=[t.dict() for t in patient.telecom],
            address=[a.dict() for a in patient.address],  # Store all address entries as a list
            birth_date=patient.birthDate,
            insurance_company=patient.insurance_company,
            insurance_number=patient.insurance_number
        )
        
        db.add(db_patient)
        await db.commit()
        await db.refresh(db_patient)
        
        if not db_patient.id:
            raise HTTPException(status_code=500, detail="Failed to create patient record")
        
        # Convert to FHIR response format
        return PatientResponse.from_orm(db_patient)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[PatientResponse])
async def list_patients(
    db: Session = Depends(get_db),
    first_name: Optional[str] = Query(None),
    last_name: Optional[str] = Query(None),
    phone: Optional[str] = Query(None),
    birth_date: Optional[date] = Query(None),
    insurance_company: Optional[str] = Query(None)
):
    """List patients with optional filtering"""
    query = select(Patient)
    
    if first_name:
        # Search in the first name entry's given names array
        query = query.where(cast(Patient.name[0]['given'], String).ilike(f"%{first_name}%"))
    if last_name:
        # Search in the first name entry's family name
        query = query.where(cast(Patient.name[0]['family'], String).ilike(f"%{last_name}%"))
    if phone:
        # Search in telecom array for matching phone number
        query = query.where(Patient.telecom.cast(JSONB).contains([{"system": "phone", "value": phone}]))
    if birth_date:
        query = query.where(Patient.birth_date == birth_date)
    if insurance_company:
        query = query.where(Patient.insurance_company.ilike(f"%{insurance_company}%"))
    
    result = await db.execute(query)
    patients = result.scalars().all()
    
    return [PatientResponse.from_orm(patient) for patient in patients]

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: int, db: Session = Depends(get_db)):
    """Get a specific patient by ID"""
    query = select(Patient).where(Patient.id == patient_id)
    result = await db.execute(query)
    patient = result.scalar_one_or_none()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return PatientResponse.from_orm(patient)

@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: int,
    patient: PatientCreate,
    db: Session = Depends(get_db)
):
    """Update a patient record"""
    query = select(Patient).where(Patient.id == patient_id)
    result = await db.execute(query)
    db_patient = result.scalar_one_or_none()
    
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Update all fields
    db_patient.name = [n.dict() for n in patient.name]  # Store all name entries as a list
    db_patient.telecom = [t.dict() for t in patient.telecom]
    db_patient.address = [a.dict() for a in patient.address]  # Store all address entries as a list
    db_patient.birth_date = patient.birthDate
    db_patient.insurance_company = patient.insurance_company
    db_patient.insurance_number = patient.insurance_number
    
    await db.commit()
    await db.refresh(db_patient)
    return PatientResponse.from_orm(db_patient)

@router.delete("/{patient_id}")
async def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    """Delete a patient record"""
    query = select(Patient).where(Patient.id == patient_id)
    result = await db.execute(query)
    patient = result.scalar_one_or_none()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    await db.delete(patient)
    await db.commit()
    return {"message": f"Patient with ID {patient_id} deleted."} 