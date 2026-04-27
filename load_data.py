"""
CKAN → PostgreSQL data loader for Contract Intelligence.

Pulls contracts from Open Canada's Proactive Disclosure API
and loads them into your Render PostgreSQL database.

Usage:
    pip install psycopg2-binary requests
    python load_data.py
"""

import requests
import psycopg2
import psycopg2.extras
import os
import sys
import time

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://database_database_w2a1_user:JvqVh0msmuBrwgING68S52H0sz3wEEXI"
    "@dpg-d7auudv5r7bs738iqh70-a.oregon-postgres.render.com"
    "/database_database_w2a1"
)

RESOURCE_ID = "fac950c0-00d5-4ec1-a4d3-9cbebf98a305"
API_URL = "https://open.canada.ca/data/en/api/3/action/datastore_search"
BATCH_SIZE = 1000          # records per API call
INSERT_BATCH = 500         # records per INSERT

# Last 10 years of reporting periods
YEAR_START = 2015
YEAR_END = 2026

COLUMNS = [
    "reference_number", "procurement_id", "vendor_name", "vendor_postal_code",
    "buyer_name", "contract_date", "economic_object_code", "description_en",
    "description_fr", "contract_period_start", "delivery_date",
    "contract_value", "original_value", "amendment_value",
    "comments_en", "comments_fr", "additional_comments_en", "additional_comments_fr",
    "agreement_type_code", "trade_agreement", "land_claims",
    "commodity_type", "commodity_code", "country_of_vendor",
    "solicitation_procedure", "limited_tendering_reason",
    "trade_agreement_exceptions", "indigenous_business",
    "indigenous_business_excluding_psib", "intellectual_property",
    "potential_commercial_exploitation", "former_public_servant",
    "contracting_entity", "standing_offer_number", "instrument_type",
    "ministers_office", "number_of_bids", "article_6_exceptions",
    "award_criteria", "socioeconomic_indicator",
    "reporting_period", "owner_org", "owner_org_title",
]

CREATE_TABLE = f"""
CREATE TABLE IF NOT EXISTS contracts (
    id SERIAL PRIMARY KEY,
    {', '.join(f'"{c}" TEXT' for c in COLUMNS)}
);
"""

CREATE_INDEXES = """
CREATE INDEX IF NOT EXISTS idx_contracts_date ON contracts (contract_date);
CREATE INDEX IF NOT EXISTS idx_contracts_vendor ON contracts (vendor_name);
CREATE INDEX IF NOT EXISTS idx_contracts_commodity ON contracts (commodity_type);
CREATE INDEX IF NOT EXISTS idx_contracts_eoc ON contracts (economic_object_code);
CREATE INDEX IF NOT EXISTS idx_contracts_period ON contracts (reporting_period);
CREATE INDEX IF NOT EXISTS idx_contracts_value ON contracts (contract_value);
"""


def fetch_page(offset=0, filters=None):
    params = {
        "resource_id": RESOURCE_ID,
        "limit": BATCH_SIZE,
        "offset": offset,
    }
    if filters:
        params["filters"] = str(filters).replace("'", '"')

    for attempt in range(3):
        try:
            r = requests.get(API_URL, params=params, timeout=60)
            r.raise_for_status()
            data = r.json()
            if data.get("success"):
                return data["result"]["records"], data["result"]["total"]
        except Exception as e:
            print(f"  ⚠ Attempt {attempt+1} failed: {e}")
            time.sleep(2 ** attempt)
    return [], 0


def cast_numeric(record):
    """Convert value fields from string to numeric for proper storage."""
    for field in ["contract_value", "original_value", "amendment_value"]:
        val = record.get(field)
        if val is not None:
            try:
                record[field] = str(float(val))
            except (ValueError, TypeError):
                record[field] = None
    return record


def load():
    print("=" * 60)
    print("Contract Intelligence — Data Loader")
    print("=" * 60)

    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()

    # Create table
    print("\n[1/4] Creating table...")
    cur.execute(CREATE_TABLE)
    print("  ✓ Table 'contracts' ready")

    # Check existing data
    cur.execute("SELECT COUNT(*) FROM contracts")
    existing = cur.fetchone()[0]
    if existing > 0:
        print(f"  ℹ Table already has {existing:,} rows — skipping reload")
        cur.execute(CREATE_INDEXES)
        print("  ✓ Indexes created")
        conn.close()
        return

    # Fetch data
    print("\n[2/4] Fetching data from CKAN API...")
    total_inserted = 0
    conn.autocommit = False

    # Build reporting period filters for last 10 years
    periods = []
    for year in range(YEAR_START, YEAR_END + 1):
        for q in range(1, 5):
            periods.append(f"{year}-{year+1}-Q{q}")

    # First fetch without filter to get total
    _, total = fetch_page(0)
    print(f"  Total records in dataset: {total:,}")
    print(f"  Loading all records (this may take a while)...")

    offset = 0
    while True:
        records, total = fetch_page(offset)
        if not records:
            break

        # Filter to last 10 years by contract_date
        filtered = []
        for r in records:
            date = r.get("contract_date", "")
            if date:
                try:
                    year = int(date[:4])
                    if YEAR_START <= year <= YEAR_END:
                        filtered.append(cast_numeric(r))
                except (ValueError, IndexError):
                    pass

        if filtered:
            # Insert batch
            cols = ", ".join(f'"{c}"' for c in COLUMNS)
            placeholders = ", ".join(["%s"] * len(COLUMNS))
            insert_sql = f"INSERT INTO contracts ({cols}) VALUES ({placeholders})"

            batch = []
            for record in filtered:
                values = tuple(record.get(c) for c in COLUMNS)
                batch.append(values)

            psycopg2.extras.execute_batch(cur, insert_sql, batch, page_size=INSERT_BATCH)
            conn.commit()
            total_inserted += len(filtered)

        offset += BATCH_SIZE
        pct = min(offset / max(total, 1) * 100, 100)
        sys.stdout.write(f"\r  Progress: {offset:,}/{total:,} fetched, {total_inserted:,} loaded ({pct:.1f}%)")
        sys.stdout.flush()

        if offset >= total:
            break

    print(f"\n  ✓ Loaded {total_inserted:,} records")

    # Create indexes
    print("\n[3/4] Creating indexes...")
    conn.autocommit = True
    cur.execute(CREATE_INDEXES)
    print("  ✓ Indexes created")

    # Verify
    print("\n[4/4] Verification...")
    cur.execute("SELECT COUNT(*) FROM contracts")
    count = cur.fetchone()[0]
    cur.execute("SELECT MIN(contract_date), MAX(contract_date) FROM contracts WHERE contract_date IS NOT NULL")
    mn, mx = cur.fetchone()
    cur.execute("SELECT COUNT(DISTINCT vendor_name) FROM contracts")
    vendors = cur.fetchone()[0]
    print(f"  Rows: {count:,}")
    print(f"  Date range: {mn} → {mx}")
    print(f"  Unique vendors: {vendors:,}")

    conn.close()
    print("\n✅ Data load complete!")


if __name__ == "__main__":
    load()
