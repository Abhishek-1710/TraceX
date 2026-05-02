from rapidfuzz import fuzz
import pandas as pd
from typing import List, Dict

AUTO_ACCEPT  = 0.90   # exact PAN + GSTIN match = same business, auto accept
REVIEW_MIN   = 0.30   # below this = completely different, ignore

def compute_confidence(a: dict, b: dict) -> float:
    score = 0.0
    reasons = []

    pan_a   = a.get('pan', '').strip()
    pan_b   = b.get('pan', '').strip()
    gst_a   = a.get('gstin', '').strip()
    gst_b   = b.get('gstin', '').strip()
    name_a  = a.get('company_name', '').strip()
    name_b  = b.get('company_name', '').strip()
    addr_a  = a.get('address', '').strip()
    addr_b  = b.get('address', '').strip()

    # EDGE CASE: same name, different PAN = definitely different businesses
    # e.g. "Ram Traders" in Mumbai vs "Ram Traders" in Delhi, different owners
    if name_a and name_b and name_a == name_b:
        if pan_a and pan_b and pan_a != pan_b:
            return 0.0

    # PAN match — strong identifier (40% weight)
    if pan_a and pan_b:
        if pan_a == pan_b:
            score += 0.40

    # GSTIN match — strong identifier (30% weight)
    if gst_a and gst_b:
        if gst_a == gst_b:
            score += 0.30

    # One has PAN, other has GSTIN only — medium confidence
    # This is the key case for human review
    if pan_a and not pan_b and gst_a and gst_b and gst_a == gst_b:
        score += 0.20   # GSTIN matches but PAN missing in one record
    if pan_b and not pan_a and gst_a and gst_b and gst_a == gst_b:
        score += 0.20

    # Fuzzy name similarity (20% weight)
    if name_a and name_b:
        name_sim = fuzz.token_sort_ratio(name_a, name_b) / 100
        score += name_sim * 0.20

    # Address similarity (10% weight)
    if addr_a and addr_b:
        addr_sim = fuzz.token_sort_ratio(addr_a, addr_b) / 100
        score += addr_sim * 0.10

    return round(min(score, 1.0), 3)


def match_records(df: pd.DataFrame) -> List[Dict]:
    results = []
    records = df.to_dict('records')
    n = len(records)

    for i in range(n):
        for j in range(i + 1, n):
            conf = compute_confidence(records[i], records[j])

            if conf < REVIEW_MIN:
                continue   # completely different, skip

            if conf >= AUTO_ACCEPT:
                status = 'auto_accept'
            else:
                status = 'needs_review'   # medium confidence = human reviews this

            results.append({
                'record_a': records[i],
                'record_b': records[j],
                'confidence': conf,
                'status': status
            })

    results.sort(key=lambda x: x['confidence'], reverse=True)
    return results