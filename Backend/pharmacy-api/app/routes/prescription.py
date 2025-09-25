from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import pytesseract
from PIL import Image
import io
import json
import logging
import os

from ..database import get_db
from ..models.prescription import Prescription, PrescriptionSource, PrescriptionStatus
from ..models.sale import Sale
from ..schemas.prescription import PrescriptionCreate, PrescriptionUpdate, PrescriptionOut
from app.core.auth import current_active_user
from ..models.user import User
from ..models.patient import Patient
from ..models.medication import Medication
from ..utils.ocr_utils import PrescriptionDataExtractor, OCRProcessingError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])

# Initialize OCR processor
ocr_processor = PrescriptionDataExtractor()

@router.post("/", response_model=PrescriptionOut)
async def create_prescription(
    prescription: PrescriptionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(current_active_user)
):
    """Create a new prescription from electronic source
    
    Example request body:
    {
        "identifier": [{"system": "http://example.com/prescriptions", "value": "RX123456"}],
        "status": "active",
        "intent": "order",
        "subject": {"reference": "Patient/1", "display": "John Doe"},
        "authored_on": "2024-03-25T12:00:00",
        "requester": {"reference": "Practitioner/1", "display": "Dr. Smith"},
        "dosage_instruction": [{
            "sequence": 1,
            "text": "Take one tablet three times daily",
            "timing": {
                "repeat": {
                    "frequency": 3,
                    "period": 1,
                    "periodUnit": "d"
                }
            },
            "route": {"text": "oral"},
            "dose_and_rate": [{
                "type": {"text": "ordered"},
                "dose": {"value": 1, "unit": "tablet"}
            }]
        }],
        "prescription_source": "ELECTRONIC",
        "patient_id": 1,
        "prescriber_id": 1,
        "medication_id": 1
    }
    """
    try:
        # Validate and fetch related models
        patient = await db.get(Patient, prescription.patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail=f"Patient {prescription.patient_id} not found")

        prescriber = await db.get(User, prescription.prescriber_id)
        if not prescriber:
            raise HTTPException(status_code=404, detail=f"Prescriber {prescription.prescriber_id} not found")

        medication = await db.get(Medication, prescription.medication_id)
        if not medication:
            raise HTTPException(status_code=404, detail=f"Medication {prescription.medication_id} not found")

        # Create the prescription instance
        db_prescription = Prescription(
            # FHIR MedicationRequest fields
            identifier=prescription.identifier,
            status=prescription.status,
            intent=prescription.intent,
            category=prescription.category,
            priority=prescription.priority,
            subject=prescription.subject,
            encounter=prescription.encounter,
            authored_on=prescription.authored_on.replace(tzinfo=None),
            requester=prescription.requester,
            reason_code=prescription.reason_code,
            dosage_instruction=[d.dict() for d in prescription.dosage_instruction],
            dispense_request=prescription.dispense_request,
            substitution=prescription.substitution,
            
            # Pharmacy-specific fields
            prescription_source=PrescriptionSource(prescription.prescription_source),
            scanned_image_url=prescription.scanned_image_url,
            ocr_text=prescription.ocr_text,
            ocr_confidence=prescription.ocr_confidence,
            prescription_status=PrescriptionStatus.PENDING,

            # Relationships - use foreign key IDs
            patient_id=patient.id,
            prescriber_id=prescriber.id,
            medication_id=medication.id
        )

        # Set the SQLAlchemy relationship after creation
        db_prescription.medication = medication

        db.add(db_prescription)
        await db.commit()
        await db.refresh(db_prescription)
        return db_prescription

    except Exception as e:
        logger.error(f"Error creating prescription: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Internal error creating prescription")

@router.get("/", response_model=List[PrescriptionOut])
async def list_prescriptions(
    status: Optional[str] = None,
    patient_id: Optional[int] = None,
    prescriber_id: Optional[int] = None,
    source: Optional[PrescriptionSource] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(current_active_user)
):
    try:
        query = select(Prescription)
        if status:
            query = query.filter(Prescription.status == status)
        if patient_id:
            query = query.filter(Prescription.patient_id == patient_id)
        if prescriber_id:
            query = query.filter(Prescription.prescriber_id == prescriber_id)
        if source:
            query = query.filter(Prescription.prescription_source == source)
        result = await db.execute(query)
        return result.scalars().all()
    except Exception as e:
        logger.error(f"Error listing prescriptions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list prescriptions")

@router.get("/{prescription_id}", response_model=PrescriptionOut)
async def get_prescription(
    prescription_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(current_active_user)
):
    try:
        prescription = await db.get(Prescription, prescription_id)
        if not prescription:
            raise HTTPException(status_code=404, detail="Prescription not found")
        return prescription
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting prescription: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get prescription")

@router.put("/{prescription_id}", response_model=PrescriptionOut)
async def update_prescription(
    prescription_id: int,
    prescription_update: PrescriptionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(current_active_user)
):
    try:
        prescription = await db.get(Prescription, prescription_id)
        if not prescription:
            raise HTTPException(status_code=404, detail="Prescription not found")

        # Handle relationship updates
        if prescription_update.patient_id is not None:
            patient = await db.get(Patient, prescription_update.patient_id)
            if not patient:
                raise HTTPException(status_code=404, detail=f"Patient {prescription_update.patient_id} not found")
            prescription.patient_id = patient.id

        if prescription_update.prescriber_id is not None:
            prescriber = await db.get(User, prescription_update.prescriber_id)
            if not prescriber:
                raise HTTPException(status_code=404, detail=f"Prescriber {prescription_update.prescriber_id} not found")
            prescription.prescriber_id = prescriber.id

        if prescription_update.medication_id is not None:
            medication = await db.get(Medication, prescription_update.medication_id)
            if not medication:
                raise HTTPException(status_code=404, detail=f"Medication {prescription_update.medication_id} not found")
            prescription.medication_id = medication.id
            prescription.medication = medication

        # Handle datetime fields
        if prescription_update.authored_on is not None:
            prescription_update.authored_on = prescription_update.authored_on.replace(tzinfo=None)

        # Update all other fields
        update_data = prescription_update.dict(exclude_unset=True, exclude={'patient_id', 'prescriber_id', 'medication_id'})
        
        # Handle enum fields
        if 'prescription_source' in update_data:
            update_data['prescription_source'] = PrescriptionSource(update_data['prescription_source'])
        if 'prescription_status' in update_data:
            update_data['prescription_status'] = PrescriptionStatus(update_data['prescription_status'])

        for field, value in update_data.items():
            setattr(prescription, field, value)

        await db.commit()
        await db.refresh(prescription)
        return prescription
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating prescription: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update prescription")

@router.delete("/{prescription_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prescription(
    prescription_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(current_active_user)
):
    try:
        prescription = await db.get(Prescription, prescription_id)
        if not prescription:
            raise HTTPException(status_code=404, detail="Prescription not found")

        await db.delete(prescription)
        await db.commit()
        return {"message": "Prescription deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting prescription: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete prescription")

# Helper: Mark prescription as dispensed after sale
@router.post("/{prescription_id}/mark-dispensed")
async def mark_prescription_dispensed(
    prescription_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(current_active_user)
):
    prescription = await db.get(Prescription, prescription_id)
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    prescription.prescription_status = PrescriptionStatus.DISPENSED
    await db.commit()
    return {"message": f"Prescription {prescription_id} marked as dispensed."}
