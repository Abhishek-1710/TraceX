from rapidfuzz import fuzz
import pandas as pd
from typing import List, Dict
from loguru import logger

AUTO_ACCEPT  = 0.85   # high confidence → auto accept
REVIEW_MIN   = 0.60   # below this = different, skip


def normalize_text(text: str) -> str:
    return text.lower().strip() if text else ""


def normalize_id(text: str) -> str:
    return text.upper().strip() if text else ""


def compute_confidence(a: dict, b: dict) -> dict:
    score = 0.0
    reasons = []

    pan_a = normalize_id(a.get("pan"))
    pan_b = normalize_id(b.get("pan"))

    gst_a = normalize_id(a.get("gstin"))
    gst_b = normalize_id(b.get("gstin"))

    name_a = normalize_text(a.get("company_name"))
    name_b = normalize_text(b.get("company_name"))

    addr_a = normalize_text(a.get("address"))
    addr_b = normalize_text(b.get("address"))

    # EDGE CASE: same name, different PAN = definitely different businesses
    # e.g. "Ram Traders" in Mumbai vs "Ram Traders" in Delhi, different owners
    if name_a and name_b and name_a == name_b:
        if pan_a and pan_b and pan_a != pan_b:
            return {
                "score": 0.0,
                "reasons": ["Same name but different PAN"]
            }

    # PAN match — strong identifier (40% weight)
    if pan_a and pan_b:
        if pan_a == pan_b:
            score += 0.40
            reasons.append("PAN match")

    # GSTIN match — strong identifier (30% weight)
    if gst_a and gst_b:
        if gst_a == gst_b:
            score += 0.30
            reasons.append("GSTIN match")

            # One has PAN, other has GSTIN only — medium confidence
            # This is the key case for human review
            if pan_a and not pan_b:
                score += 0.20
                reasons.append("GSTIN match, PAN missing in one record")

            elif pan_b and not pan_a:
                score += 0.20
                reasons.append("GSTIN match, PAN missing in one record")

    # Fuzzy name similarity (20% weight)
    if name_a and name_b:
        name_sim = fuzz.token_sort_ratio(name_a, name_b) / 100
        score += name_sim * 0.20

        if name_sim > 0.80:
            reasons.append(f"High name similarity ({round(name_sim, 2)})")

    # Address similarity (10% weight)
    if addr_a and addr_b:
        addr_sim = fuzz.token_sort_ratio(addr_a, addr_b) / 100
        score += addr_sim * 0.10

        if addr_sim > 0.75:
            reasons.append(f"Address similarity ({round(addr_sim, 2)})")

    final_score = round(min(score, 1.0), 3)

    logger.info(f"Score: {final_score} | Reasons: {reasons}")

    return {
        "score": final_score,
        "reasons": reasons
    }


def match_records(df: pd.DataFrame) -> List[Dict]:
    results = []
    records = df.to_dict('records')
    n = len(records)

    for i in range(n):
        for j in range(i + 1, n):

            # Basic blocking: only compare if pincode matches (improves performance)
            if records[i].get("pincode") and records[j].get("pincode"):
                if records[i]["pincode"] != records[j]["pincode"]:
                    continue

            result = compute_confidence(records[i], records[j])
            conf = result["score"]

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
                'status': status,
                'reasons': result["reasons"]
            })

    results.sort(key=lambda x: x['confidence'], reverse=True)
    return results