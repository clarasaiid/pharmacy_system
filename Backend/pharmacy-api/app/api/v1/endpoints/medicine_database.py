from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import pandas as pd
from io import StringIO
from app.core.deps import get_db
from app.models.medicine_database import MedicineDatabase
from app.core.ai import classify_medicine

router = APIRouter()

@router.post("/upload")
async def upload_medicine_database(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    try:
        # Read CSV file
        contents = await file.read()
        df = pd.read_csv(StringIO(contents.decode('utf-8')))
        
        # Validate required columns
        required_columns = ['name', 'price']
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(
                status_code=400,
                detail=f"CSV must contain these columns: {', '.join(required_columns)}"
            )
        
        # Process each row
        for _, row in df.iterrows():
            # Get AI classification for the medicine
            classification = classify_medicine(row['name'])
            
            # Create medicine entry
            medicine = MedicineDatabase(
                name=row['name'],
                price=float(row['price']),
                active_ingredient=classification.get('active_ingredient', 'Unknown'),
                category=classification.get('category', 'Unknown'),
                manufacturer=classification.get('manufacturer', 'Unknown'),
                dosage_form=classification.get('dosage_form', 'Unknown'),
                effects=classification.get('effects', 'Unknown'),
                ai_classification=classification
            )
            
            db.add(medicine)
        
        db.commit()
        return {"message": "Medicine database uploaded successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
def search_medicines(
    query: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    medicines = db.query(MedicineDatabase).filter(
        MedicineDatabase.name.ilike(f"%{query}%")
    ).all()
    return medicines

@router.get("/{medicine_id}")
def get_medicine(
    medicine_id: int,
    db: Session = Depends(get_db)
):
    medicine = db.query(MedicineDatabase).filter(MedicineDatabase.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return medicine 