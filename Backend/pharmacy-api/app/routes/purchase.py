from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime
import json

from ..database import get_db
from ..models.purchase import Purchase, PurchaseItem
from ..models.inventory import InventoryItem
from ..schemas.purchase import PurchaseCreate, PurchaseOut, PurchaseItemCreate
from ..models.organization import Organization
from ..models.medication import Medication

router = APIRouter(
    prefix="/purchases",
    tags=["purchases"]
)

def transform_organization_to_dict(org: Organization) -> dict:
    return {
        "id": org.id,
        "name": org.name,
        "identifier": org.identifier,
        "active": org.active,
        "type": org.type,
        "telecom": org.telecom,
        "address": org.address
    }

def transform_purchase_item_to_dict(item: PurchaseItem) -> dict:
    return {
        "id": item.id,
        "sequence": item.sequence,
        "item": item.item,
        "quantity": item.quantity,
        "purchase_id": item.purchase_id,
        "medication_id": item.medication_id,
        "quantity_ordered": item.quantity_ordered,
        "quantity_received": item.quantity_received,
        "unit_price": item.unit_price,
        "total_price": item.total_price,
        "batch_number": item.batch_number or "",
        "expiration_date": item.expiration_date or datetime.utcnow()
    }

@router.post("/", response_model=PurchaseOut)
async def create_purchase(purchase: PurchaseCreate, db: AsyncSession = Depends(get_db)):
    """Create a new purchase and update inventory"""
    # Create purchase without supplier relationship
    purchase_data = purchase.model_dump(exclude={'purchase_items', 'supplier'})
    
    # Convert timezone-aware datetimes to naive datetimes
    if purchase_data.get('order_date'):
        purchase_data['order_date'] = purchase_data['order_date'].replace(tzinfo=None)
    if purchase_data.get('expected_delivery_date'):
        purchase_data['expected_delivery_date'] = purchase_data['expected_delivery_date'].replace(tzinfo=None)
    if purchase_data.get('actual_delivery_date'):
        purchase_data['actual_delivery_date'] = purchase_data['actual_delivery_date'].replace(tzinfo=None)
    
    db_purchase = Purchase(**purchase_data)
    
    # Set supplier reference
    result = await db.execute(select(Organization).filter(Organization.id == purchase.supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=404, detail=f"Supplier organization {purchase.supplier_id} not found")
    db_purchase.supplier = supplier
    
    db.add(db_purchase)
    await db.commit()
    await db.refresh(db_purchase)

    # Create purchase items and update inventory
    for item in purchase.purchase_items:
        # Verify medication exists
        result = await db.execute(select(Medication).filter(Medication.id == item.medication_id))
        medication = result.scalar_one_or_none()
        if not medication:
            raise HTTPException(status_code=404, detail=f"Medication with ID {item.medication_id} not found")

        item_data = item.model_dump()
        # Remove batch_number and expiration_date from item_data as they're not in the model
        batch_number = item_data.pop('batch_number', None)
        expiration_date = item_data.pop('expiration_date', None)
        if expiration_date:
            expiration_date = expiration_date.replace(tzinfo=None)
        
        db_item = PurchaseItem(**item_data, purchase_id=db_purchase.id)
        db_item.batch_number = batch_number
        db_item.expiration_date = expiration_date
        db.add(db_item)

        # Update inventory quantity - find the specific inventory item
        result = await db.execute(
            select(InventoryItem)
            .filter(
                InventoryItem.fhir_medication_id == item.medication_id,
                InventoryItem.supplier_id == purchase.supplier_id,
                InventoryItem.batch_number == batch_number
            )
        )
        inventory_item = result.scalar_one_or_none()

        if inventory_item:
            inventory_item.stock_quantity += item.quantity_received
        else:
            # If no matching inventory item found, create a new one
            new_inventory = InventoryItem(
                status="active",
                fhir_medication_id=item.medication_id,
                supplier_id=purchase.supplier_id,
                batch_number=batch_number,
                stock_quantity=item.quantity_received,
                purchase_price=item.unit_price,
                purchase_date=datetime.utcnow(),
                expiration_date=expiration_date,
                code=json.dumps({
                    "system": medication.code_system,
                    "value": medication.code_value,
                    "display": medication.code_display or "Medication"
                }),
                quantity=json.dumps({
                    "value": item.quantity_received,
                    "unit": "unit",
                    "system": "http://unitsofmeasure.org",
                    "code": "1"
                })
            )
            new_inventory.medication = medication
            db.add(new_inventory)

    await db.commit()
    
    # Load the purchase with all relationships
    result = await db.execute(
        select(Purchase)
        .options(
            selectinload(Purchase.supplier),
            selectinload(Purchase.purchase_items)
        )
        .filter(Purchase.id == db_purchase.id)
    )
    db_purchase = result.scalar_one()
    
    # Transform the response
    response_data = {
        "id": db_purchase.id,
        "status": db_purchase.status,
        "category": db_purchase.category,
        "priority": db_purchase.priority,
        "item": db_purchase.item,
        "quantity": db_purchase.quantity,
        "parameter": db_purchase.parameter,
        "order_date": db_purchase.order_date,
        "expected_delivery_date": db_purchase.expected_delivery_date,
        "actual_delivery_date": db_purchase.actual_delivery_date,
        "total_amount": db_purchase.total_amount,
        "payment_status": db_purchase.payment_status,
        "payment_method": db_purchase.payment_method,
        "supplier_id": db_purchase.supplier_id,
        "supplier": transform_organization_to_dict(db_purchase.supplier),
        "purchase_items": [transform_purchase_item_to_dict(item) for item in db_purchase.purchase_items]
    }
    
    return response_data

@router.get("/", response_model=List[PurchaseOut])
async def list_purchases(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    supplier_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all purchases with optional filters"""
    query = select(Purchase).options(
        selectinload(Purchase.supplier),
        selectinload(Purchase.purchase_items)
    )

    if status:
        query = query.filter(Purchase.status == status)
    if payment_status:
        query = query.filter(Purchase.payment_status == payment_status)
    if supplier_id:
        query = query.filter(Purchase.supplier_id == supplier_id)

    result = await db.execute(query.offset(skip).limit(limit))
    purchases = result.scalars().all()
    
    # Transform the response
    return [{
        "id": purchase.id,
        "status": purchase.status,
        "category": purchase.category,
        "priority": purchase.priority,
        "item": purchase.item,
        "quantity": purchase.quantity,
        "parameter": purchase.parameter,
        "order_date": purchase.order_date,
        "expected_delivery_date": purchase.expected_delivery_date,
        "actual_delivery_date": purchase.actual_delivery_date,
        "total_amount": purchase.total_amount,
        "payment_status": purchase.payment_status,
        "payment_method": purchase.payment_method,
        "supplier_id": purchase.supplier_id,
        "supplier": transform_organization_to_dict(purchase.supplier),
        "purchase_items": [transform_purchase_item_to_dict(item) for item in purchase.purchase_items]
    } for purchase in purchases]

@router.get("/{purchase_id}", response_model=PurchaseOut)
async def get_purchase(purchase_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific purchase by ID"""
    result = await db.execute(
        select(Purchase)
        .options(
            selectinload(Purchase.supplier),
            selectinload(Purchase.purchase_items)
        )
        .filter(Purchase.id == purchase_id)
    )
    purchase = result.scalar_one_or_none()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    
    # Transform the response
    return {
        "id": purchase.id,
        "status": purchase.status,
        "category": purchase.category,
        "priority": purchase.priority,
        "item": purchase.item,
        "quantity": purchase.quantity,
        "parameter": purchase.parameter,
        "order_date": purchase.order_date,
        "expected_delivery_date": purchase.expected_delivery_date,
        "actual_delivery_date": purchase.actual_delivery_date,
        "total_amount": purchase.total_amount,
        "payment_status": purchase.payment_status,
        "payment_method": purchase.payment_method,
        "supplier_id": purchase.supplier_id,
        "supplier": transform_organization_to_dict(purchase.supplier),
        "purchase_items": [transform_purchase_item_to_dict(item) for item in purchase.purchase_items]
    }

@router.put("/{purchase_id}", response_model=PurchaseOut)
async def update_purchase(
    purchase_id: int,
    purchase: PurchaseCreate,
    db: AsyncSession = Depends(get_db)
):
    """Update a purchase"""
    result = await db.execute(
        select(Purchase)
        .options(
            selectinload(Purchase.supplier),
            selectinload(Purchase.purchase_items)
        )
        .filter(Purchase.id == purchase_id)
    )
    db_purchase = result.scalar_one_or_none()
    if not db_purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    # Update base fields
    purchase_data = purchase.model_dump(exclude={'purchase_items', 'supplier'})
    
    # Convert timezone-aware datetimes to naive datetimes
    if purchase_data.get('order_date'):
        purchase_data['order_date'] = purchase_data['order_date'].replace(tzinfo=None)
    if purchase_data.get('expected_delivery_date'):
        purchase_data['expected_delivery_date'] = purchase_data['expected_delivery_date'].replace(tzinfo=None)
    if purchase_data.get('actual_delivery_date'):
        purchase_data['actual_delivery_date'] = purchase_data['actual_delivery_date'].replace(tzinfo=None)
    
    for key, value in purchase_data.items():
        setattr(db_purchase, key, value)

    # Update supplier reference
    result = await db.execute(select(Organization).filter(Organization.id == purchase.supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=404, detail=f"Supplier organization {purchase.supplier_id} not found")
    db_purchase.supplier = supplier

    # Rollback inventory before replacing items
    result = await db.execute(select(PurchaseItem).filter(PurchaseItem.purchase_id == purchase_id))
    old_items = result.scalars().all()
    for old in old_items:
        result = await db.execute(
            select(InventoryItem)
            .filter(
                InventoryItem.fhir_medication_id == old.medication_id,
                InventoryItem.supplier_id == db_purchase.supplier_id,
                InventoryItem.batch_number == old.batch_number
            )
        )
        inventory_item = result.scalar_one_or_none()
        if inventory_item:
            inventory_item.stock_quantity -= old.quantity_received

    # Delete existing purchase items
    await db.execute(
        delete(PurchaseItem).where(PurchaseItem.purchase_id == purchase_id)
    )

    # Add updated items and update inventory again
    for item in purchase.purchase_items:
        # Verify medication exists
        result = await db.execute(select(Medication).filter(Medication.id == item.medication_id))
        medication = result.scalar_one_or_none()
        if not medication:
            raise HTTPException(status_code=404, detail=f"Medication with ID {item.medication_id} not found")

        item_data = item.model_dump()
        # Remove batch_number and expiration_date from item_data as they're not in the model
        batch_number = item_data.pop('batch_number', None)
        expiration_date = item_data.pop('expiration_date', None)
        if expiration_date:
            expiration_date = expiration_date.replace(tzinfo=None)
        
        db_item = PurchaseItem(**item_data, purchase_id=purchase_id)
        db_item.batch_number = batch_number
        db_item.expiration_date = expiration_date
        db.add(db_item)

        # Update inventory quantity - find the specific inventory item
        result = await db.execute(
            select(InventoryItem)
            .filter(
                InventoryItem.fhir_medication_id == item.medication_id,
                InventoryItem.supplier_id == purchase.supplier_id,
                InventoryItem.batch_number == batch_number
            )
        )
        inventory_item = result.scalar_one_or_none()

        if inventory_item:
            inventory_item.stock_quantity += item.quantity_received
        else:
            # If no matching inventory item found, create a new one
            new_inventory = InventoryItem(
                status="active",
                fhir_medication_id=item.medication_id,
                supplier_id=purchase.supplier_id,
                batch_number=batch_number,
                stock_quantity=item.quantity_received,
                purchase_price=item.unit_price,
                purchase_date=datetime.utcnow(),
                expiration_date=expiration_date,
                code=json.dumps({
                    "system": medication.code_system,
                    "value": medication.code_value,
                    "display": medication.code_display or "Medication"
                }),
                quantity=json.dumps({
                    "value": item.quantity_received,
                    "unit": "unit",
                    "system": "http://unitsofmeasure.org",
                    "code": "1"
                })
            )
            new_inventory.medication = medication
            db.add(new_inventory)

    await db.commit()
    
    # Load the purchase with all relationships
    result = await db.execute(
        select(Purchase)
        .options(
            selectinload(Purchase.supplier),
            selectinload(Purchase.purchase_items)
        )
        .filter(Purchase.id == purchase_id)
    )
    db_purchase = result.scalar_one()
    
    # Transform the response
    return {
        "id": db_purchase.id,
        "status": db_purchase.status,
        "category": db_purchase.category,
        "priority": db_purchase.priority,
        "item": db_purchase.item,
        "quantity": db_purchase.quantity,
        "parameter": db_purchase.parameter,
        "order_date": db_purchase.order_date,
        "expected_delivery_date": db_purchase.expected_delivery_date,
        "actual_delivery_date": db_purchase.actual_delivery_date,
        "total_amount": db_purchase.total_amount,
        "payment_status": db_purchase.payment_status,
        "payment_method": db_purchase.payment_method,
        "supplier_id": db_purchase.supplier_id,
        "supplier": transform_organization_to_dict(db_purchase.supplier),
        "purchase_items": [transform_purchase_item_to_dict(item) for item in db_purchase.purchase_items]
    }

@router.delete("/{purchase_id}")
async def delete_purchase(purchase_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a purchase and roll back inventory"""
    result = await db.execute(select(Purchase).filter(Purchase.id == purchase_id))
    purchase = result.scalar_one_or_none()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    # Roll back inventory
    result = await db.execute(select(PurchaseItem).filter(PurchaseItem.purchase_id == purchase_id))
    items = result.scalars().all()
    for item in items:
        result = await db.execute(
            select(InventoryItem)
            .filter(
                InventoryItem.fhir_medication_id == item.medication_id,
                InventoryItem.supplier_id == purchase.supplier_id,
                InventoryItem.batch_number == item.batch_number
            )
        )
        inventory_item = result.scalar_one_or_none()
        if inventory_item:
            inventory_item.stock_quantity -= item.quantity_received

    await db.execute(select(PurchaseItem).filter(PurchaseItem.purchase_id == purchase_id).delete())
    await db.delete(purchase)
    await db.commit()
    return {"message": "Purchase deleted and inventory rolled back successfully"}
