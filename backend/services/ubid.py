from sqlalchemy.orm import Session
from models.business import Business
import uuid

def create_business_record(data: dict, confidence: float, db: Session) -> Business:
    if data.get('pan'):
        existing = db.query(Business).filter(Business.pan == data['pan']).first()
        if existing:
            return existing

    if data.get('gstin'):
        existing = db.query(Business).filter(Business.gstin == data['gstin']).first()
        if existing:
            return existing

    business = Business(
        ubid=uuid.uuid4(),
        company_name=data.get('company_name', ''),
        pan=data.get('pan', ''),
        gstin=data.get('gstin', ''),
        address=data.get('address', ''),
        pincode=data.get('pincode', ''),
        state=data.get('state', ''),
        confidence_score=confidence,
        review_status='APPROVED',
        status='ACTIVE'
    )
    db.add(business)
    db.commit()
    db.refresh(business)
    return business