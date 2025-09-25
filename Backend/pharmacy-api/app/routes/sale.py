from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.sale import Sale, SaleItem
from app.models.patient import Patient
from app.schemas.sale import SaleCreate, SaleResponse
from datetime import datetime
from random import randint

router = APIRouter(prefix="/sales", tags=["Sales"])

def generate_invoice_number():
    now = datetime.utcnow()
    return f"INV-{now.year}-{randint(100,999)}"

@router.post("/", response_model=SaleResponse)
async def create_sale(sale_data: SaleCreate, db: AsyncSession = Depends(get_db)):
    # 1. Resolve patient
    patient_id = None

    if sale_data.patient_id:
        patient_id = sale_data.patient_id

    elif sale_data.patient_phone:
        result = await db.execute(select(Patient).filter(Patient.phone == sale_data.patient_phone))
        patient = result.scalar_one_or_none()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        patient_id = patient.id

    # Convert timezone-aware datetimes to naive
    sale_date = sale_data.date.replace(tzinfo=None) if sale_data.date else datetime.utcnow()
    created_at = datetime.utcnow()

    # 2. Create Sale
    sale = Sale(
        invoice_number=generate_invoice_number(),
        date=sale_date,
        created_at=created_at,
        customer_name=sale_data.customer_name,
        patient_id=patient_id,
        payment_method=sale_data.payment_method,
        payment_status=sale_data.payment_status,
        status=sale_data.status,
        total_amount=0.0,  # Temp, will calculate
    )

    # 3. Add SaleItems
    total = 0.0
    for item_data in sale_data.sale_items:
        total_price = item_data.quantity * item_data.unit_price
        item = SaleItem(
            sequence=item_data.sequence,
            charge_item=item_data.charge_item,
            price_component=item_data.price_component,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            total_price=total_price,
            medication_id=item_data.medication_id,
            inventory_item_id=item_data.inventory_item_id
        )
        sale.sale_items.append(item)
        total += total_price

    sale.total_amount = total
    db.add(sale)
    await db.flush()  # Flush to get the IDs
    await db.refresh(sale)  # Refresh to load all relationships
    await db.commit()
    
    # 4. Return the created sale with all relationships
    return sale

@router.get("/chart-data")
async def get_sales_chart_data(db: AsyncSession = Depends(get_db)):
    query = select(
        func.date_trunc("day", Sale.created_at).label("day"),
        func.sum(Sale.total_amount).label("total")
    ).group_by("day").order_by("day")
    
    result = await db.execute(query)
    results = result.all()

    data = []
    prev_total = None

    for row in results:
        total = float(row.total)
        change = None
        if prev_total is not None and prev_total > 0:
            change = round(((total - prev_total) / prev_total) * 100, 2)
        data.append({
            "date": row.day.strftime("%Y-%m-%d"),
            "total": total,
            "change_percent": change
        })
        prev_total = total

    return data
