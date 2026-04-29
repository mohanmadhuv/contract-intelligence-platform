"""
BigQuery data loader for Contract Intelligence.
Fetches all procurement contracts from CKAN Open Government API and loads into BigQuery.
"""
import os
import json
import urllib.request
import urllib.parse
from google.cloud import bigquery

PROJECT_ID = os.getenv("GCP_PROJECT_ID", "agency2026ot-v-sync-0429")
DATASET_ID = os.getenv("BQ_DATASET", "contract_intelligence")
TABLE_ID = "contracts"
FULL_TABLE = f"{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}"

CKAN_BASE = "https://open.canada.ca/data/en/api/3/action/datastore_search"
RESOURCE_ID = "fac950c0-00df-4bb6-a947-657754d92039"
BATCH_SIZE = 5000

# BigQuery schema — typed columns instead of all-TEXT
SCHEMA = [
    bigquery.SchemaField("reference_number", "STRING"),
    bigquery.SchemaField("procurement_id", "STRING"),
    bigquery.SchemaField("vendor_name", "STRING"),
    bigquery.SchemaField("vendor_postal_code", "STRING"),
    bigquery.SchemaField("contract_date", "DATE"),
    bigquery.SchemaField("delivery_date", "DATE"),
    bigquery.SchemaField("contract_value", "FLOAT64"),
    bigquery.SchemaField("original_value", "FLOAT64"),
    bigquery.SchemaField("amendment_value", "FLOAT64"),
    bigquery.SchemaField("economic_object_code", "STRING"),
    bigquery.SchemaField("commodity_type", "STRING"),
    bigquery.SchemaField("commodity_code", "STRING"),
    bigquery.SchemaField("description_en", "STRING"),
    bigquery.SchemaField("description_fr", "STRING"),
    bigquery.SchemaField("owner_org", "STRING"),
    bigquery.SchemaField("owner_org_title", "STRING"),
    bigquery.SchemaField("solicitation_procedure", "STRING"),
    bigquery.SchemaField("limited_tendering_reason", "STRING"),
    bigquery.SchemaField("trade_agreement", "STRING"),
    bigquery.SchemaField("land_claims", "STRING"),
    bigquery.SchemaField("aboriginal_business", "STRING"),
    bigquery.SchemaField("intellectual_property", "STRING"),
    bigquery.SchemaField("potential_commercial_exploitation", "STRING"),
    bigquery.SchemaField("former_public_servant", "STRING"),
    bigquery.SchemaField("standing_offer", "STRING"),
    bigquery.SchemaField("standing_offer_number", "STRING"),
    bigquery.SchemaField("document_type_code", "STRING"),
    bigquery.SchemaField("reporting_period", "STRING"),
]

def safe_float(val):
    """Convert a value to float, returning None for invalid/empty."""
    if val is None or val == "" or val == "None":
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None

def safe_date(val):
    """Convert a value to YYYY-MM-DD date string, returning None for invalid."""
    if val is None or val == "" or val == "None":
        return None
    try:
        s = str(val).strip()[:10]
        # Validate it parses
        parts = s.split("-")
        if len(parts) == 3 and len(parts[0]) == 4:
            int(parts[0]); int(parts[1]); int(parts[2])
            return s
    except (ValueError, TypeError, IndexError):
        pass
    return None

def transform_row(row):
    """Transform a CKAN row into a BigQuery-compatible dict."""
    return {
        "reference_number": str(row.get("reference_number", "") or "").strip(),
        "procurement_id": str(row.get("procurement_id", "") or "").strip(),
        "vendor_name": str(row.get("vendor_name", "") or "").strip(),
        "vendor_postal_code": str(row.get("vendor_postal_code", "") or "").strip(),
        "contract_date": safe_date(row.get("contract_date")),
        "delivery_date": safe_date(row.get("delivery_date")),
        "contract_value": safe_float(row.get("contract_value")),
        "original_value": safe_float(row.get("original_value")),
        "amendment_value": safe_float(row.get("amendment_value")),
        "economic_object_code": str(row.get("economic_object_code", "") or "").strip(),
        "commodity_type": str(row.get("commodity_type", "") or "").strip(),
        "commodity_code": str(row.get("commodity_code", "") or "").strip(),
        "description_en": str(row.get("description_en", "") or "").strip()[:4096],
        "description_fr": str(row.get("description_fr", "") or "").strip()[:4096],
        "owner_org": str(row.get("owner_org", "") or "").strip(),
        "owner_org_title": str(row.get("owner_org_title", "") or "").strip(),
        "solicitation_procedure": str(row.get("solicitation_procedure", "") or "").strip(),
        "limited_tendering_reason": str(row.get("limited_tendering_reason", "") or "").strip(),
        "trade_agreement": str(row.get("trade_agreement", "") or "").strip(),
        "land_claims": str(row.get("land_claims", "") or "").strip(),
        "aboriginal_business": str(row.get("aboriginal_business", "") or "").strip(),
        "intellectual_property": str(row.get("intellectual_property", "") or "").strip(),
        "potential_commercial_exploitation": str(row.get("potential_commercial_exploitation", "") or "").strip(),
        "former_public_servant": str(row.get("former_public_servant", "") or "").strip(),
        "standing_offer": str(row.get("standing_offer", "") or "").strip(),
        "standing_offer_number": str(row.get("standing_offer_number", "") or "").strip(),
        "document_type_code": str(row.get("document_type_code", "") or "").strip(),
        "reporting_period": str(row.get("reporting_period", "") or "").strip(),
    }


def fetch_ckan_records():
    """Fetch all records from CKAN API with pagination."""
    all_rows = []
    offset = 0
    total = None

    while True:
        params = urllib.parse.urlencode({
            "resource_id": RESOURCE_ID,
            "limit": BATCH_SIZE,
            "offset": offset,
        })
        url = f"{CKAN_BASE}?{params}"
        print(f"  Fetching offset={offset}...")

        req = urllib.request.Request(url, headers={"User-Agent": "ContractIntelligence/1.0"})
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        result = data.get("result", {})
        records = result.get("records", [])
        if total is None:
            total = result.get("total", 0)
            print(f"  Total records in CKAN: {total}")

        if not records:
            break

        all_rows.extend(records)
        offset += len(records)
        print(f"  Fetched {len(all_rows)} / {total}")

        if offset >= total:
            break

    return all_rows


def create_dataset_if_needed(client):
    """Create the BigQuery dataset if it doesn't exist."""
    dataset_ref = bigquery.DatasetReference(PROJECT_ID, DATASET_ID)
    try:
        client.get_dataset(dataset_ref)
        print(f"  Dataset {DATASET_ID} already exists.")
    except Exception:
        dataset = bigquery.Dataset(dataset_ref)
        dataset.location = "northamerica-northeast1"
        client.create_dataset(dataset)
        print(f"  Created dataset {DATASET_ID} in northamerica-northeast1.")


def load_to_bigquery(rows):
    """Load transformed rows into BigQuery."""
    client = bigquery.Client(project=PROJECT_ID)

    # Create dataset
    create_dataset_if_needed(client)

    # Configure load job
    job_config = bigquery.LoadJobConfig(
        schema=SCHEMA,
        write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
        source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
    )

    # Transform rows
    print(f"  Transforming {len(rows)} rows...")
    transformed = []
    skipped = 0
    for r in rows:
        t = transform_row(r)
        # Only include rows with valid contract_date and contract_value
        if t["contract_date"] and t["contract_value"] and t["contract_value"] > 0:
            year = int(t["contract_date"][:4])
            if 2015 <= year <= 2026:
                transformed.append(t)
            else:
                skipped += 1
        else:
            skipped += 1

    print(f"  Kept {len(transformed)} rows, skipped {skipped} (no date/value or out of range)")

    # Load
    print(f"  Loading into {FULL_TABLE}...")
    job = client.load_table_from_json(transformed, FULL_TABLE, job_config=job_config)
    job.result()  # Wait

    table = client.get_table(FULL_TABLE)
    print(f"  ✓ Loaded {table.num_rows} rows into {FULL_TABLE}")


if __name__ == "__main__":
    print("═══ Contract Intelligence — CKAN → BigQuery Loader ═══")
    print(f"  Project:  {PROJECT_ID}")
    print(f"  Dataset:  {DATASET_ID}")
    print(f"  Table:    {TABLE_ID}")
    print()

    print("Step 1: Fetching from CKAN API...")
    records = fetch_ckan_records()
    print(f"  Total fetched: {len(records)}")
    print()

    print("Step 2: Loading into BigQuery...")
    load_to_bigquery(records)
    print()
    print("═══ Done ═══")
