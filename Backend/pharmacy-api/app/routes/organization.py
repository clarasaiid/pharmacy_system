from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from ..database import get_db
from ..models.organization import Organization
from ..schemas.organization import OrganizationCreate, OrganizationOut

router = APIRouter(
    prefix="/organizations",
    tags=["organizations"]
)

@router.post("/", response_model=OrganizationOut)
async def create_organization(organization: OrganizationCreate, db: AsyncSession = Depends(get_db)):
    """Create a new organization"""
    db_org = Organization(**organization.model_dump())
    db.add(db_org)
    await db.commit()
    await db.refresh(db_org)
    return db_org

@router.get("/", response_model=List[OrganizationOut])
async def list_organizations(
    skip: int = 0,
    limit: int = 100,
    active: Optional[bool] = None,
    organization_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all organizations with optional filters"""
    query = select(Organization)
    
    if active is not None:
        query = query.where(Organization.active == active)
    if organization_type:
        query = query.where(Organization.organization_type == organization_type)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{org_id}", response_model=OrganizationOut)
async def get_organization(org_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific organization by ID"""
    query = select(Organization).where(Organization.id == org_id)
    result = await db.execute(query)
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

@router.put("/{org_id}", response_model=OrganizationOut)
async def update_organization(
    org_id: int,
    organization: OrganizationCreate,
    db: AsyncSession = Depends(get_db)
):
    """Update an organization"""
    query = select(Organization).where(Organization.id == org_id)
    result = await db.execute(query)
    db_org = result.scalar_one_or_none()
    if not db_org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    for key, value in organization.model_dump().items():
        setattr(db_org, key, value)
    
    await db.commit()
    await db.refresh(db_org)
    return db_org

@router.delete("/{org_id}")
async def delete_organization(org_id: int, db: AsyncSession = Depends(get_db)):
    """Delete an organization"""
    query = select(Organization).where(Organization.id == org_id)
    result = await db.execute(query)
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    await db.delete(org)
    await db.commit()
    return {"message": "Organization deleted successfully"} 