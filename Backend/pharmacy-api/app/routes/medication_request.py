from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from ..core.auth import current_active_user
from ..db.session import get_db
from ..models.user import User
from ..models.medication_request import MedicationRequest
from ..schemas.medication_request import MedicationRequestCreate, MedicationRequestRead, MedicationRequestUpdate

router = APIRouter()

@router.get("/", response_model=List[MedicationRequestRead])
async def get_medication_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(current_active_user)
):
    result = await db.execute(select(MedicationRequest))
    medication_requests = result.scalars().all()
    return medication_requests

@router.post("/", response_model=MedicationRequestRead)
async def create_medication_request(
    medication_request: MedicationRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(current_active_user)
):
    db_medication_request = MedicationRequest(**medication_request.dict())
    db.add(db_medication_request)
    await db.commit()
    await db.refresh(db_medication_request)
    return db_medication_request

@router.get("/{medication_request_id}", response_model=MedicationRequestRead)
async def get_medication_request(
    medication_request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(current_active_user)
):
    result = await db.execute(select(MedicationRequest).where(MedicationRequest.id == medication_request_id))
    medication_request = result.scalar_one_or_none()
    if medication_request is None:
        raise HTTPException(status_code=404, detail="Medication request not found")
    return medication_request

@router.put("/{medication_request_id}", response_model=MedicationRequestRead)
async def update_medication_request(
    medication_request_id: int,
    medication_request: MedicationRequestUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(current_active_user)
):
    result = await db.execute(select(MedicationRequest).where(MedicationRequest.id == medication_request_id))
    db_medication_request = result.scalar_one_or_none()
    if db_medication_request is None:
        raise HTTPException(status_code=404, detail="Medication request not found")
    
    for key, value in medication_request.dict(exclude_unset=True).items():
        setattr(db_medication_request, key, value)
    
    await db.commit()
    await db.refresh(db_medication_request)
    return db_medication_request

@router.delete("/{medication_request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medication_request(
    medication_request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(current_active_user)
):
    result = await db.execute(select(MedicationRequest).where(MedicationRequest.id == medication_request_id))
    medication_request = result.scalar_one_or_none()
    if medication_request is None:
        raise HTTPException(status_code=404, detail="Medication request not found")
    
    await db.delete(medication_request)
    await db.commit()
