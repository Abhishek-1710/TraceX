from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from services.processor import process_dataframe
from services.matcher import match_records
from services.ubid import create_business_record
from models.business import MatchQueue
import pandas as pd
import io, json

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(400, "Only CSV and Excel files supported")

    contents = await file.read()

    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(400, f"Could not parse file: {e}")

    clean_df = process_dataframe(df)
    matches  = match_records(clean_df)

    auto_added   = 0
    needs_review = 0

    for match in matches:
        if match['status'] == 'auto_accept':
            merged = {**match['record_b'], **match['record_a']}
            create_business_record(merged, match['confidence'], db)
            auto_added += 1
        else:
            q = MatchQueue(
                record_a=json.dumps(match['record_a']),
                record_b=json.dumps(match['record_b']),
                confidence=match['confidence']
            )
            db.add(q)
            needs_review += 1

    matched_pans = set()
    for m in matches:
        matched_pans.add(m['record_a'].get('pan'))
        matched_pans.add(m['record_b'].get('pan'))

    for _, row in clean_df.iterrows():
        if row.get('pan') not in matched_pans:
            create_business_record(row.to_dict(), 1.0, db)

    db.commit()

    return {
        "message": "File processed successfully",
        "rows_received": len(df),
        "rows_after_cleaning": len(clean_df),
        "auto_added_to_db": auto_added,
        "sent_to_review": needs_review
    }