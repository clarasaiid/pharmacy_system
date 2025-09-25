from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.medication_dispenses import MedicationDispense, DispenseStatus
from app.schemas.medication_dispense import (
    MedicationDispenseCreate,
    MedicationDispenseUpdate,
    MedicationDispenseResponse
)

router = APIRouter(
    prefix="/api/medication-dispenses",
    tags=["Medication Dispenses"]
)


@router.post("/", response_model=MedicationDispenseResponse, status_code=201)
def create_medication_dispense(
    dispense: MedicationDispenseCreate,
    db: Session = Depends(get_db)
):
    db_dispense = MedicationDispense(**dispense.dict())
    db.add(db_dispense)
    db.commit()
    db.refresh(db_dispense)
    return db_dispense


@router.get("/", response_model=List[MedicationDispenseResponse])
def list_medication_dispenses(
    skip: int = Query(0),
    limit: int = Query(10),
    status: Optional[DispenseStatus] = Query(None),
    patient_id: Optional[int] = Query(None),
    medication_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(MedicationDispense)

    if status:
        query = query.filter(MedicationDispense.status == status)
    if patient_id:
        query = query.filter(MedicationDispense.patient_id == patient_id)
    if medication_id:
        query = query.filter(MedicationDispense.medication_id == medication_id)

    return query.order_by(MedicationDispense.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{dispense_id}", response_model=MedicationDispenseResponse)
def get_medication_dispense(
    dispense_id: int = Path(..., description="ID of the medication dispense"),
    db: Session = Depends(get_db)
):
    dispense = db.query(MedicationDispense).filter(MedicationDispense.id == dispense_id).first()
    if not dispense:
        raise HTTPException(status_code=404, detail="Medication dispense not found")
    return dispense


@router.put("/{dispense_id}", response_model=MedicationDispenseResponse)
def update_medication_dispense(
    dispense_id: int,
    dispense_update: MedicationDispenseUpdate,
    db: Session = Depends(get_db)
):
    db_dispense = db.query(MedicationDispense).filter(MedicationDispense.id == dispense_id).first()
    if not db_dispense:
        raise HTTPException(status_code=404, detail="Medication dispense not found")

    for key, value in dispense_update.dict(exclude_unset=True).items():
        setattr(db_dispense, key, value)

    db.commit()
    db.refresh(db_dispense)
    return db_dispense


@router.post("/{dispense_id}/status", response_model=MedicationDispenseResponse)
def update_dispense_status(
    dispense_id: int,
    status: DispenseStatus = Query(..., description="New status for the dispense"),
    db: Session = Depends(get_db)
):
    db_dispense = db.query(MedicationDispense).filter(MedicationDispense.id == dispense_id).first()
    if not db_dispense:
        raise HTTPException(status_code=404, detail="Medication dispense not found")

    db_dispense.status = status
    if status == DispenseStatus.IN_PROGRESS:
        db_dispense.when_prepared = datetime.utcnow()
    elif status == DispenseStatus.COMPLETED:
        db_dispense.when_handed_over = datetime.utcnow()

    db.commit()
    db.refresh(db_dispense)
    return db_dispense


@router.delete("/{dispense_id}", status_code=204)
def delete_medication_dispense(
    dispense_id: int,
    db: Session = Depends(get_db)
):
    db_dispense = db.query(MedicationDispense).filter(MedicationDispense.id == dispense_id).first()
    if not db_dispense:
        raise HTTPException(status_code=404, detail="Medication dispense not found")

    if db_dispense.status != DispenseStatus.PREPARATION:
        raise HTTPException(
            status_code=400,
            detail="Can only delete dispenses in PREPARATION status"
        )

    db.delete(db_dispense)
    db.commit()
    return
