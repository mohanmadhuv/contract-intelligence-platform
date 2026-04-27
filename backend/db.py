import os
import psycopg2
import psycopg2.extras

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://database_database_w2a1_user:JvqVh0msmuBrwgING68S52H0sz3wEEXI"
    "@dpg-d7auudv5r7bs738iqh70-b.replica-cyan.oregon-postgres.render.com"
    "/database_database_w2a1"
)


def get_conn():
    return psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)


def query(sql: str, params=None):
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(sql, params or [])
        rows = cur.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def scalar(sql: str, params=None):
    rows = query(sql, params)
    if rows:
        return list(rows[0].values())[0]
    return None
