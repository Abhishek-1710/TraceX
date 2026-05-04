from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.business import Business, ActivityLog
from services.monitor import generate_alerts
from loguru import logger

router = APIRouter()

@router.get("")
def get_alerts(db: Session = Depends(get_db)):
    businesses = db.query(Business).all()
    all_logs = db.query(ActivityLog).all()

    # Group logs by UBID
    logs_map = {}
    for log in all_logs:
        logs_map.setdefault(log.ubid, []).append(log)

    flagged = []
    for biz in businesses:
        logs   = logs_map.get(biz.ubid, [])
        alerts = generate_alerts(biz, logs)
        if alerts:
            flagged.append({
                "ubid": str(biz.ubid),
                "company_name": biz.company_name,
                "status": biz.status,
                "alerts": alerts
            })
    logger.info(f"Flagged businesses: {len(flagged)}")
    return {"count": len(flagged), "flagged_businesses": flagged}