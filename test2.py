import sys
sys.path.insert(0, 'backend')
from db import get_connection
c = get_connection().cursor()
c.execute("""
WITH yearly_vendor_spend AS (
    SELECT EXTRACT(YEAR FROM contract_date::date)::int AS year, vendor_name,
    SUM(contract_value::numeric) AS spend
    FROM contracts WHERE EXTRACT(YEAR FROM contract_date::date) BETWEEN 2015 AND 2025
    GROUP BY 1, 2
),
sh AS (
    SELECT year, vendor_name,
    spend / SUM(spend) OVER(PARTITION BY year) AS share
    FROM yearly_vendor_spend
)
SELECT year, ROUND(SUM(POWER(share,2))::numeric,4) AS hhi, COUNT(DISTINCT vendor_name) AS vendor_count
FROM sh GROUP BY year ORDER BY year
""")
print(c.fetchall())
