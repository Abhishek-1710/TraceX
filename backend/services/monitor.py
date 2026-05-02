from datetime import datetime
from sqlalchemy.orm import Session
from models.business import Business, ActivityLog

def classify_status(last_activity_date) -> str:
    if not last_activity_date:
        return 'DORMANT'
    days = (datetime.now() - last_activity_date.replace(tzinfo=None)).days
    if days < 180:
        return 'ACTIVE'
    elif days < 365:
        return 'DORMANT'
    return 'CLOSED'

def generate_alerts(biz: Business, logs: list) -> list:
    alerts = []

    has_electricity = any(l.has_electricity_usage for l in logs)
    has_inspection  = any(l.last_inspection_date  for l in logs)
    license_ok      = all(l.license_active for l in logs if l.source == 'license')

    if biz.status == 'ACTIVE' and not has_inspection:
        alerts.append({"type": "WARNING", "message": "Active but no inspection on record"})

    if biz.status == 'ACTIVE' and not has_electricity:
        alerts.append({"type": "WARNING", "message": "Registered but no electricity usage detected"})

    if not license_ok:
        alerts.append({"type": "DANGER", "message": "License expired or inactive"})

    recent = [l for l in logs if l.event_date and
              (datetime.now() - l.event_date.replace(tzinfo=None)).days < 60]
    if biz.status == 'ACTIVE' and not recent:
        alerts.append({"type": "INFO", "message": "Sudden drop — no activity in last 60 days"})

    return alerts