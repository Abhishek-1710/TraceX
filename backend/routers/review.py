from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.business import MatchQueue
from services.ubid import create_business_record
import uuid, json

router = APIRouter()

class ReviewDecision(BaseModel):
    queue_id: str
    decision: str
    reviewer_note: str = ""

@router.get("/queue")
def get_queue(db: Session = Depends(get_db)):
    pending = db.query(MatchQueue).filter(MatchQueue.status == 'PENDING').all()
    return {
        "count": len(pending),
        "items": [{
            "id": str(i.id),
            "confidence": i.confidence,
            "record_a": json.loads(i.record_a),
            "record_b": json.loads(i.record_b),
            "created_at": str(i.created_at)
        } for i in pending]
    }

@router.post("/decide")
def decide(decision: ReviewDecision, db: Session = Depends(get_db)):
    item = db.query(MatchQueue).filter(MatchQueue.id == uuid.UUID(decision.queue_id)).first()
    if not item:
        raise HTTPException(404, "Item not found")

    if decision.decision == "approve":
        item.status = "APPROVED"
        a = json.loads(item.record_a)
        b = json.loads(item.record_b)
        merged = {**b, **a}
        create_business_record(merged, item.confidence, db)
    else:
        item.status = "REJECTED"

    item.reviewer_note = decision.reviewer_note
    db.commit()
    return {"message": f"Match {decision.decision}d", "id": str(item.id)}

@router.get("/stats")
def stats(db: Session = Depends(get_db)):
    return {
        "total":    db.query(MatchQueue).count(),
        "pending":  db.query(MatchQueue).filter(MatchQueue.status == 'PENDING').count(),
        "approved": db.query(MatchQueue).filter(MatchQueue.status == 'APPROVED').count(),
        "rejected": db.query(MatchQueue).filter(MatchQueue.status == 'REJECTED').count(),
    }