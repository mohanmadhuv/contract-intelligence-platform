"""
Database abstraction for Contract Intelligence.
Uses Google BigQuery via Application Default Credentials (ADC).
"""
import os
from google.cloud import bigquery

PROJECT_ID = os.getenv("GCP_PROJECT_ID", "agency2026ot-v-sync-0429")
DATASET_ID = os.getenv("BQ_DATASET", "contract_intelligence")

# Singleton client
_client = None

def get_client():
    global _client
    if _client is None:
        _client = bigquery.Client(project=PROJECT_ID)
    return _client


def query(sql: str, params=None):
    """Execute a BigQuery SQL query and return list of dicts."""
    client = get_client()
    job_config = bigquery.QueryJobConfig()
    if params:
        job_config.query_parameters = params

    result = client.query(sql, job_config=job_config)
    rows = []
    for row in result:
        rows.append(dict(row))
    return rows


def scalar(sql: str, params=None):
    """Execute a query and return the first column of the first row."""
    rows = query(sql, params)
    if rows:
        return list(rows[0].values())[0]
    return None


def table_ref():
    """Return fully qualified table reference."""
    return f"`{PROJECT_ID}.{DATASET_ID}.contracts`"
