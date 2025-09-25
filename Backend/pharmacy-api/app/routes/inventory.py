from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models.inventory import InventoryItem
from ..models.medication import Medication
from ..schemas.inventory import InventoryItemCreate, InventoryItemOut
from ..schemas.medication import CodeableConcept

router = APIRouter(
    prefix="/inventory",
    tags=["inventory"]
)

def transform_medication_to_codeable_concept(medication: Medication) -> CodeableConcept:
    """Transform a Medication model into a CodeableConcept"""
    return CodeableConcept(
        system=medication.code_system,
        value=medication.code_value,
        display=medication.code_display or "Medication"
    )

@router.post("/", response_model=InventoryItemOut)
async def create_inventory_item(item: InventoryItemCreate, db: AsyncSession = Depends(get_db)):
    """Create a new inventory item"""
    # Get the medication
    result = await db.execute(select(Medication).filter(Medication.id == item.fhir_medication_id))
    medication = result.scalar_one_or_none()
    if not medication:
        raise HTTPException(status_code=404, detail=f"Medication with ID {item.fhir_medication_id} not found")

    # Create inventory item without relationships
    item_data = item.model_dump(exclude={'medication'})
    
    # Convert timezone-aware datetimes to naive
    if item_data.get('expiration_date'):
        item_data['expiration_date'] = item_data['expiration_date'].replace(tzinfo=None)
    if item_data.get('purchase_date'):
        item_data['purchase_date'] = item_data['purchase_date'].replace(tzinfo=None)
    
    db_item = InventoryItem(**item_data)
    
    # Set the medication relationship
    db_item.medication = medication
    
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    
    # Reload the item with the relationship
    result = await db.execute(
        select(InventoryItem)
        .options(selectinload(InventoryItem.medication))
        .filter(InventoryItem.id == db_item.id)
    )
    db_item = result.scalar_one()
    
    # Transform the response
    response_data = db_item.__dict__.copy()
    response_data['medication'] = transform_medication_to_codeable_concept(db_item.medication)
    return response_data

@router.get("/", response_model=List[InventoryItemOut])
async def list_inventory_items(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    medication_id: Optional[int] = None,
    supplier_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all inventory items with optional filters"""
    query = select(InventoryItem).options(selectinload(InventoryItem.medication))
    
    if status:
        query = query.filter(InventoryItem.status == status)
    if medication_id:
        query = query.filter(InventoryItem.fhir_medication_id == medication_id)
    if supplier_id:
        query = query.filter(InventoryItem.supplier_id == supplier_id)
    
    result = await db.execute(query.offset(skip).limit(limit))
    items = result.scalars().all()
    
    # Transform the response
    return [
        {**item.__dict__, 'medication': transform_medication_to_codeable_concept(item.medication)}
        for item in items
    ]

@router.get("/{item_id}", response_model=InventoryItemOut)
async def get_inventory_item(item_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific inventory item by ID"""
    result = await db.execute(
        select(InventoryItem)
        .options(selectinload(InventoryItem.medication))
        .filter(InventoryItem.id == item_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    # Transform the response
    response_data = item.__dict__.copy()
    response_data['medication'] = transform_medication_to_codeable_concept(item.medication)
    return response_data

@router.put("/{item_id}", response_model=InventoryItemOut)
async def update_inventory_item(
    item_id: int,
    item: InventoryItemCreate,
    db: AsyncSession = Depends(get_db)
):
    """Update an inventory item"""
    result = await db.execute(
        select(InventoryItem)
        .options(selectinload(InventoryItem.medication))
        .filter(InventoryItem.id == item_id)
    )
    db_item = result.scalar_one_or_none()
    if not db_item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    # Get the medication
    result = await db.execute(select(Medication).filter(Medication.id == item.fhir_medication_id))
    medication = result.scalar_one_or_none()
    if not medication:
        raise HTTPException(status_code=404, detail=f"Medication with ID {item.fhir_medication_id} not found")
    
    # Update fields
    item_data = item.model_dump(exclude={'medication'})
    
    # Convert timezone-aware datetimes to naive
    if item_data.get('expiration_date'):
        item_data['expiration_date'] = item_data['expiration_date'].replace(tzinfo=None)
    if item_data.get('purchase_date'):
        item_data['purchase_date'] = item_data['purchase_date'].replace(tzinfo=None)
    
    for key, value in item_data.items():
        setattr(db_item, key, value)
    
    # Update medication relationship
    db_item.medication = medication
    
    await db.commit()
    await db.refresh(db_item)
    
    # Reload the item with the relationship
    result = await db.execute(
        select(InventoryItem)
        .options(selectinload(InventoryItem.medication))
        .filter(InventoryItem.id == db_item.id)
    )
    db_item = result.scalar_one()
    
    # Transform the response
    response_data = db_item.__dict__.copy()
    response_data['medication'] = transform_medication_to_codeable_concept(db_item.medication)
    return response_data

@router.delete("/{item_id}")
async def delete_inventory_item(item_id: int, db: AsyncSession = Depends(get_db)):
    """Delete an inventory item"""
    result = await db.execute(select(InventoryItem).filter(InventoryItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    await db.delete(item)
    await db.commit()
    return {"message": "Inventory item deleted successfully"} 