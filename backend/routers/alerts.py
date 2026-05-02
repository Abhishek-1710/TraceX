from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.business import Business, ActivityLog
from services.monitor import generate_alerts

router = APIRouter()

@router.get("/")
def get_alerts(db: Session = Depends(get_db)):
    businesses = db.query(Business).all()
    flagged = []
    for biz in businesses:
        logs   = db.query(ActivityLog).filter(ActivityLog.ubid == biz.ubid).all()
        alerts = generate_alerts(biz, logs)
        if alerts:
            flagged.append({
                "ubid": str(biz.ubid),
                "company_name": biz.company_name,
                "status": biz.status,
                "alerts": alerts
            })
    return {"count": len(flagged), "flagged_businesses": flagged}