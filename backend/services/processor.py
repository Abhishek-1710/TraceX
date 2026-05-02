import pandas as pd
import re

def normalize_address(addr) -> str:
    if not addr or pd.isna(addr):
        return ""
    addr = str(addr).lower().strip()
    addr = re.sub(r'\s+', ' ', addr)
    addr = addr.replace(" road", " rd").replace(" street", " st")
    addr = addr.replace(" nagar", " ngr").replace(" colony", " col")
    return addr

def process_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # Standardize column names
    df.columns = [c.lower().strip().replace(' ', '_') for c in df.columns]

    # Normalize each field
    df['company_name'] = df['company_name'].str.lower().str.strip()
    df['pan']          = df['pan'].apply(lambda x: str(x).upper().strip() if pd.notna(x) else '')
    df['gstin']        = df['gstin'].apply(lambda x: str(x).upper().strip() if pd.notna(x) else '')
    df['address']      = df['address'].apply(normalize_address)
    df['pincode']      = df['pincode'].astype(str).str.strip() if 'pincode' in df.columns else ''
    df['state']        = df['state'].str.lower().str.strip() if 'state' in df.columns else ''

    # Fill remaining nulls
    df.fillna('', inplace=True)

    # Drop rows with no identifier at all
    df = df[~((df['pan'] == '') & (df['gstin'] == ''))]

    # Remove exact duplicates
    df.drop_duplicates(subset=['pan', 'gstin'], keep='first', inplace=True)
    df.reset_index(drop=True, inplace=True)

    return df