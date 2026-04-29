"""
Database abstraction for Contract Intelligence.
Uses PostgreSQL for Render deployment.
"""
import os
import psycopg2
import psycopg2.extras
from urllib.parse import urlparse

DATABASE_URL = os.getenv("DATABASE_URL")

# Singleton connection
_conn = None

def get_connection():
    global _conn
    if _conn is None or _conn.closed:
        _conn = psycopg2.connect(DATABASE_URL)
    return _conn


def query(sql: str, params=None):
    """Execute a PostgreSQL query and return list of dicts."""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute(sql, params)
        rows = cur.fetchall()
        return [dict(row) for row in rows]
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()


def scalar(sql: str, params=None):
    """Execute a query and return the first column of the first row."""
    rows = query(sql, params)
    if rows:
        return list(rows[0].values())[0]
    return None


def table_ref():
    """Return table reference."""
    return "contracts"
