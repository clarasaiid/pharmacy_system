from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
from datetime import datetime

from ..database import get_db
from ..models.medication import Medication
from ..schemas.medication import MedicationCreate, MedicationUpdate, MedicationOut

router = APIRouter(
    prefix="/medications",
    tags=["medications"]
)

@router.post("/", response_model=MedicationOut)
async def create_medication(medication: MedicationCreate, db: Session = Depends(get_db)):
    try:
        # Create database record
        db_medication = Medication(
            resource_type=medication.resource_type,
            identifier=medication.identifier,
            status=medication.status,
            code_system=medication.code.system,
            code_value=medication.code.value,
            code_display=medication.code.display,
            manufacturer=medication.manufacturer,
            form=medication.form,
            amount=medication.amount,
            ingredient=medication.ingredient,
            batch=medication.batch,
            note=medication.note,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(db_medication)
        await db.commit()
        await db.refresh(db_medication)
        
        # Convert to response format
        return MedicationOut(
            id=db_medication.id,
            resource_type=db_medication.resource_type,
            identifier=db_medication.identifier,
            status=db_medication.status,
            code={
                "system": db_medication.code_system,
                "value": db_medication.code_value,
                "display": db_medication.code_display
            },
            manufacturer=db_medication.manufacturer,
            form=db_medication.form,
            amount=db_medication.amount,
            ingredient=db_medication.ingredient,
            batch=db_medication.batch,
            note=db_medication.note,
            created_at=db_medication.created_at,
            updated_at=db_medication.updated_at
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[MedicationOut])
async def list_medications(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = select(Medication).offset(skip).limit(limit)
    result = await db.execute(query)
    medications = result.scalars().all()
    
    return [
        MedicationOut(
            id=med.id,
            resource_type=med.resource_type,
            identifier=med.identifier,
            status=med.status,
            code={
                "system": med.code_system,
                "value": med.code_value,
                "display": med.code_display
            },
            manufacturer=med.manufacturer,
            form=med.form,
            amount=med.amount,
            ingredient=med.ingredient,
            batch=med.batch,
            note=med.note,
            created_at=med.created_at,
            updated_at=med.updated_at
        ) for med in medications
    ]

@router.get("/{medication_id}", response_model=MedicationOut)
async def get_medication(medication_id: int, db: Session = Depends(get_db)):
    query = select(Medication).where(Medication.id == medication_id)
    result = await db.execute(query)
    medication = result.scalar_one_or_none()
    
    if not medication:
        raise HTTPException(status_code=404, detail="Medication not found")
    
    return MedicationOut(
        id=medication.id,
        resource_type=medication.resource_type,
        identifier=medication.identifier,
        status=medication.status,
        code={
            "system": medication.code_system,
            "value": medication.code_value,
            "display": medication.code_display
        },
        manufacturer=medication.manufacturer,
        form=medication.form,
        amount=medication.amount,
        ingredient=medication.ingredient,
        batch=medication.batch,
        note=medication.note,
        created_at=medication.created_at,
        updated_at=medication.updated_at
    )

@router.put("/{medication_id}", response_model=MedicationOut)
async def update_medication(medication_id: int, update: MedicationUpdate, db: Session = Depends(get_db)):
    query = select(Medication).where(Medication.id == medication_id)
    result = await db.execute(query)
    db_med = result.scalar_one_or_none()
    
    if not db_med:
        raise HTTPException(status_code=404, detail="Medication not found")

    db_med.resource_type = update.resource_type
    db_med.identifier = update.identifier
    db_med.status = update.status
    db_med.code_system = update.code.system
    db_med.code_value = update.code.value
    db_med.code_display = update.code.display
    db_med.manufacturer = update.manufacturer
    db_med.form = update.form
    db_med.amount = update.amount
    db_med.ingredient = update.ingredient
    db_med.batch = update.batch
    db_med.note = update.note
    db_med.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(db_med)
    
    return MedicationOut(
        id=db_med.id,
        resource_type=db_med.resource_type,
        identifier=db_med.identifier,
        status=db_med.status,
        code={
            "system": db_med.code_system,
            "value": db_med.code_value,
            "display": db_med.code_display
        },
        manufacturer=db_med.manufacturer,
        form=db_med.form,
        amount=db_med.amount,
        ingredient=db_med.ingredient,
        batch=db_med.batch,
        note=db_med.note,
        created_at=db_med.created_at,
        updated_at=db_med.updated_at
    )

@router.delete("/{medication_id}")
async def delete_medication(medication_id: int, db: Session = Depends(get_db)):
    query = select(Medication).where(Medication.id == medication_id)
    result = await db.execute(query)
    medication = result.scalar_one_or_none()
    
    if not medication:
        raise HTTPException(status_code=404, detail="Medication not found")
    
    await db.delete(medication)
    await db.commit()
    return {"message": "Medication deleted successfully"}
