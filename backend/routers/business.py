from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models.business import Business
import uuid

router = APIRouter()

def fmt(b):
    return {
        "ubid": str(b.ubid), "company_name": b.company_name,
        "pan": b.pan, "gstin": b.gstin, "address": b.address,
        "pincode": b.pincode, "state": b.state,
        "status": b.status, "confidence_score": b.confidence_score,
        "created_at": str(b.created_at)
    }

@router.get("/search")
def search(q: str = Query(...), db: Session = Depends(get_db)):
    results = db.query(Business).filter(
        Business.company_name.ilike(f"%{q}%")
    ).limit(20).all()
    return {"query": q, "count": len(results), "results": [fmt(b) for b in results]}

@router.get("/all")
def list_all(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    total = db.query(Business).count()
    items = db.query(Business).offset(skip).limit(limit).all()
    return {"total": total, "results": [fmt(b) for b in items]}

@router.get("/{ubid}")
def get_one(ubid: str, db: Session = Depends(get_db)):
    try:
        b = db.query(Business).filter(Business.ubid == uuid.UUID(ubid)).first()
    except ValueError:
        raise HTTPException(400, "Invalid UBID")
    if not b:
        raise HTTPException(404, "Business not found")
    return fmt(b)