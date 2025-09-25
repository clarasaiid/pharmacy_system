from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.audit_log import StockAuditLog
from app.schemas.audit_log import AuditLogCreate, AuditLogResponse
from typing import List

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.post("/", response_model=AuditLogResponse)
def create_log(log: AuditLogCreate, db: Session = Depends(get_db)):
    db_log = StockAuditLog(**log.dict())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/", response_model=List[AuditLogResponse])
def get_logs(db: Session = Depends(get_db)):
    return db.query(StockAuditLog).order_by(StockAuditLog.timestamp.desc()).all()
