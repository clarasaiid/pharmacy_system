from sqlalchemy import Column, Integer, String, DateTime, JSON, func
from ..database import Base

class StockAuditLog(Base):
    __tablename__ = "stock_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False)  # e.g., "restock", "sale", "manual_adjust"
    inventory_item_id = Column(Integer, nullable=True)
    quantity_changed = Column(Integer, nullable=False)
    performed_by = Column(String, nullable=False)
    details = Column(JSON, nullable=True)  # optional notes, reasons, etc.
    timestamp = Column(DateTime, default=func.now())
