"""
All analytics queries for Contract Intelligence.
BigQuery SQL dialect — columns are pre-typed (no casts needed).
"""
from db import query, table_ref

TABLE = None  # Lazy-initialized

def _t():
    global TABLE
    if TABLE is None:
        TABLE = table_ref()
    return TABLE

EOC_LABELS = {
    "0432":"IT Equipment Rentals","0433":"Computer Services","0491":"Management Consulting",
    "0499":"Other Professional Services","0321":"Computing Equipment","0322":"Office Equipment",
    "0399":"Other Goods","0381":"Construction Services","0319":"Construction Materials",
    "1221":"Telecom Equipment","1222":"Telecom Services","0811":"Air Travel",
    "0812":"Ground Transport","0822":"Accommodations","0251":"Research & Development",
    "0312":"Clothing & Uniforms","0341":"Fuel & Energy","0711":"Land & Buildings Purchase",
    "1228":"Building Rentals","0494":"Translation Services","0496":"Advertising",
}
COMMODITY_LABELS = {"S":"Services","G":"Goods","C":"Construction","A":"Architecture & Engineering","IT":"IT Goods & Services","SW":"Software"}

PROV_NAMES = {
    "AB":"Alberta","BC":"British Columbia","MB":"Manitoba","NB":"New Brunswick",
    "NL":"Newfoundland and Labrador","NS":"Nova Scotia","NT":"Northwest Territories",
    "NU":"Nunavut","ON":"Ontario","PE":"Prince Edward Island","QC":"Quebec",
    "SK":"Saskatchewan","YT":"Yukon",
}

def _yf(y0, y1):
    return f"contract_date IS NOT NULL AND contract_value IS NOT NULL AND contract_value > 0 AND EXTRACT(YEAR FROM contract_date) BETWEEN {y0} AND {y1}"


# ── Overview ──
def get_overview(y0=2015, y1=2025):
    r = query(f"""SELECT COUNT(*) AS total_contracts,
        ROUND(SUM(contract_value), 0) AS total_spend_cad,
        COUNT(DISTINCT vendor_name) AS unique_vendors,
        COUNT(DISTINCT owner_org) AS departments,
        MIN(EXTRACT(YEAR FROM contract_date)) AS year_min,
        MAX(EXTRACT(YEAR FROM contract_date)) AS year_max,
        ROUND(AVG(contract_value), 0) AS avg_contract_value,
        COUNTIF(LOWER(solicitation_procedure) LIKE '%non-comp%'
            OR LOWER(solicitation_procedure) LIKE '%sole%'
            OR LOWER(solicitation_procedure) LIKE '%acan%') * 100.0 / NULLIF(COUNT(*), 0) AS sole_source_pct
        FROM {_t()} WHERE {_yf(y0, y1)}""")
    return r[0] if r else {}


# ── What is bought ──
def get_what_is_bought(y0=2015, y1=2025):
    commodity = query(f"""SELECT COALESCE(NULLIF(TRIM(commodity_type), ''), 'Unknown') AS category,
        COUNT(*) AS contracts, ROUND(SUM(contract_value), 0) AS spend,
        COUNT(DISTINCT vendor_name) AS vendors
        FROM {_t()} WHERE {_yf(y0, y1)} GROUP BY 1 ORDER BY spend DESC""")
    eoc = query(f"""SELECT COALESCE(NULLIF(TRIM(economic_object_code), ''), 'Unknown') AS code,
        COUNT(*) AS contracts, ROUND(SUM(contract_value), 0) AS spend
        FROM {_t()} WHERE {_yf(y0, y1)} AND economic_object_code IS NOT NULL
        GROUP BY 1 ORDER BY spend DESC LIMIT 15""")
    for r in eoc:
        r["label"] = EOC_LABELS.get(r["code"], r["code"])
    for r in commodity:
        r["label"] = COMMODITY_LABELS.get(r["category"], r["category"])
    return {"commodity_breakdown": commodity, "top_eoc": eoc}


# ── Spend trend ──
def get_spend_trend(category=None, y0=2015, y1=2025):
    cat = f"AND TRIM(commodity_type) = '{category}'" if category else ""
    return query(f"""WITH y AS (
        SELECT EXTRACT(YEAR FROM contract_date) AS year, COUNT(*) AS contracts,
        ROUND(SUM(contract_value), 0) AS spend, ROUND(AVG(contract_value), 0) AS avg_value
        FROM {_t()} WHERE {_yf(y0, y1)} {cat} GROUP BY 1)
        SELECT *, ROUND(SAFE_DIVIDE(spend - LAG(spend) OVER(ORDER BY year),
            LAG(spend) OVER(ORDER BY year)) * 100, 1) AS spend_yoy_pct
        FROM y ORDER BY year""")


# ── Growth ranking ──
def get_growth_ranking(y0=2015, y1=2025):
    return query(f"""WITH first_last AS (
        SELECT COALESCE(NULLIF(TRIM(commodity_type),''),'Unknown') AS category,
        MIN(EXTRACT(YEAR FROM contract_date)) AS y0, MAX(EXTRACT(YEAR FROM contract_date)) AS y1,
        MIN(CASE WHEN EXTRACT(YEAR FROM contract_date) = (SELECT MIN(EXTRACT(YEAR FROM contract_date)) FROM {_t()} WHERE {_yf(y0, y1)})
            THEN contract_value END) AS first_avg,
        SUM(CASE WHEN EXTRACT(YEAR FROM contract_date) = {y0} THEN contract_value ELSE 0 END) AS spend_start,
        SUM(CASE WHEN EXTRACT(YEAR FROM contract_date) = {y1} THEN contract_value ELSE 0 END) AS spend_end
        FROM {_t()} WHERE {_yf(y0, y1)} GROUP BY 1)
        SELECT category, ROUND(spend_start, 0) AS spend_start, ROUND(spend_end, 0) AS spend_end,
        ROUND(SAFE_DIVIDE(spend_end - spend_start, NULLIF(spend_start, 0)) * 100, 1) AS growth_pct
        FROM first_last WHERE spend_start > 0 ORDER BY growth_pct DESC LIMIT 15""")


# ── Volume ──
def get_volume(y0=2015, y1=2025, category=None):
    cat = f"AND TRIM(commodity_type) = '{category}'" if category else ""
    return query(f"""SELECT EXTRACT(YEAR FROM contract_date) AS year,
        COALESCE(NULLIF(TRIM(commodity_type), ''), 'Unknown') AS category,
        COUNT(*) AS contract_count, COUNT(DISTINCT vendor_name) AS vendor_count
        FROM {_t()} WHERE {_yf(y0, y1)} {cat} GROUP BY 1, 2 ORDER BY 1""")


# ── Unit cost ──
def get_unit_cost(y0=2015, y1=2025, category=None):
    cat = f"AND TRIM(commodity_type) = '{category}'" if category else ""
    yearly = query(f"""WITH y AS (
        SELECT EXTRACT(YEAR FROM contract_date) AS year,
        ROUND(AVG(contract_value), 0) AS avg_value,
        ROUND(SUM(contract_value), 0) AS total_spend, COUNT(*) AS contracts
        FROM {_t()} WHERE {_yf(y0, y1)} {cat} GROUP BY 1)
        SELECT *, ROUND(SAFE_DIVIDE(avg_value - LAG(avg_value) OVER(ORDER BY year),
            LAG(avg_value) OVER(ORDER BY year)) * 100, 1) AS avg_value_yoy_pct
        FROM y ORDER BY year""")
    return {"yearly": yearly, "top_categories": []}


# ── Amendments ──
def get_amendments(y0=2015, y1=2025, category=None):
    cat = f"AND TRIM(commodity_type) = '{category}'" if category else ""
    yearly = query(f"""SELECT EXTRACT(YEAR FROM contract_date) AS year,
        COUNTIF(original_value IS NOT NULL AND original_value > 0) AS amended_contracts,
        ROUND(AVG(CASE WHEN original_value IS NOT NULL AND original_value > 0
            THEN SAFE_DIVIDE(contract_value, original_value) END), 3) AS avg_inflation_ratio,
        ROUND(SUM(contract_value - COALESCE(original_value, contract_value)), 0) AS total_amendment_value
        FROM {_t()} WHERE {_yf(y0, y1)} {cat} GROUP BY 1 ORDER BY 1""")
    return {"yearly": yearly, "top_amended": []}


# ── Concentration ──
def get_concentration(y0=2015, y1=2025, category=None):
    cat = f"AND TRIM(commodity_type) = '{category}'" if category else ""
    top_vendors = query(f"""WITH t AS (SELECT SUM(contract_value) AS gt FROM {_t()} WHERE {_yf(y0, y1)} {cat})
        SELECT vendor_name, COUNT(*) AS contracts, ROUND(SUM(contract_value), 0) AS spend,
        ROUND(SAFE_DIVIDE(SUM(contract_value), MAX(gt)) * 100, 2) AS market_share_pct
        FROM {_t()} CROSS JOIN t WHERE {_yf(y0, y1)} {cat}
        GROUP BY vendor_name ORDER BY spend DESC LIMIT 15""")
    hhi_trend = query(f"""WITH yearly_vendor_spend AS (
        SELECT EXTRACT(YEAR FROM contract_date) AS year, vendor_name,
        SUM(contract_value) AS spend
        FROM {_t()} WHERE {_yf(y0, y1)} {cat} GROUP BY 1, 2),
        sh AS (
        SELECT year, vendor_name,
        SAFE_DIVIDE(spend, SUM(spend) OVER(PARTITION BY year)) AS share
        FROM yearly_vendor_spend)
        SELECT year, ROUND(SUM(POW(share, 2)), 4) AS hhi,
        COUNT(DISTINCT vendor_name) AS vendor_count
        FROM sh GROUP BY year ORDER BY year""")
    return {"top_vendors": top_vendors, "hhi_trend": hhi_trend}


# ── Less for more ──
def get_less_for_more(y0=2015, y1=2025):
    rows = query(f"""WITH base AS (
        SELECT COALESCE(NULLIF(TRIM(commodity_type), ''), 'Unknown') AS category,
        EXTRACT(YEAR FROM contract_date) AS year,
        SUM(contract_value) AS spend, COUNT(*) AS contracts,
        AVG(contract_value) AS avg_value,
        AVG(CASE WHEN original_value IS NOT NULL AND original_value > 0
            THEN SAFE_DIVIDE(contract_value, original_value) END) AS inflation_ratio,
        COUNTIF(LOWER(solicitation_procedure) LIKE '%non-comp%'
            OR LOWER(solicitation_procedure) LIKE '%sole%'
            OR LOWER(solicitation_procedure) LIKE '%acan%') * 100.0 / NULLIF(COUNT(*), 0) AS sole_source_pct
        FROM {_t()} WHERE {_yf(y0, y1)} GROUP BY 1, 2),
        fl AS (
        SELECT category, SUM(spend) AS total_spend,
        AVG(sole_source_pct) AS avg_sole_pct, AVG(inflation_ratio) AS avg_inflation,
        MIN(CASE WHEN year = (SELECT MIN(year) FROM base b2 WHERE b2.category = base.category) THEN spend END) AS s0,
        MAX(CASE WHEN year = (SELECT MAX(year) FROM base b2 WHERE b2.category = base.category) THEN spend END) AS s1,
        MIN(CASE WHEN year = (SELECT MIN(year) FROM base b2 WHERE b2.category = base.category) THEN avg_value END) AS c0,
        MAX(CASE WHEN year = (SELECT MAX(year) FROM base b2 WHERE b2.category = base.category) THEN avg_value END) AS c1
        FROM base GROUP BY category)
        SELECT category, ROUND(total_spend, 0) AS total_spend,
        ROUND(SAFE_DIVIDE(s1 - s0, NULLIF(s0, 0)) * 100, 1) AS spend_growth_pct,
        ROUND(SAFE_DIVIDE(c1 - c0, NULLIF(c0, 0)) * 100, 1) AS unit_cost_growth_pct,
        ROUND(avg_sole_pct, 1) AS sole_source_pct,
        ROUND(avg_inflation, 3) AS amendment_inflation_ratio
        FROM fl WHERE s0 > 0 AND s1 > 0 ORDER BY spend_growth_pct DESC NULLS LAST LIMIT 20""")
    for r in rows:
        r["category_label"] = COMMODITY_LABELS.get(r["category"], r["category"])
        sg = float(r["spend_growth_pct"] or 0)
        cg = float(r["unit_cost_growth_pct"] or 0)
        ss = float(r["sole_source_pct"] or 0)
        ai = float(r["amendment_inflation_ratio"] or 1) - 1
        r["erosion_score"] = round(0.3 * sg + 0.25 * cg + 0.2 * ss + 0.15 * ai * 100, 1)
    rows.sort(key=lambda r: r["erosion_score"], reverse=True)
    return rows


# ═══════════════════════ DASHBOARD ENDPOINTS ═══════════════════════

def get_topline_trend(y0=2015, y1=2025):
    return query(f"""SELECT EXTRACT(YEAR FROM contract_date) AS fiscal_year,
        ROUND(SUM(contract_value), 0) AS total_spend,
        COUNT(*) AS contract_count,
        ROUND(AVG(contract_value), 0) AS avg_contract_value,
        ROUND(AVG(CASE WHEN original_value IS NOT NULL AND original_value > 0
            THEN SAFE_DIVIDE(contract_value, original_value) END), 4) AS avg_amendment
        FROM {_t()} WHERE {_yf(y0, y1)} GROUP BY 1 ORDER BY 1""")


def get_category_summaries(y0=2015, y1=2025):
    rows = query(f"""WITH yearly AS (
        SELECT COALESCE(NULLIF(TRIM(economic_object_code), ''), 'Unknown') AS code,
        EXTRACT(YEAR FROM contract_date) AS year,
        SUM(contract_value) AS spend, COUNT(*) AS cnt, AVG(contract_value) AS avg_val,
        AVG(CASE WHEN original_value IS NOT NULL AND original_value > 0
            THEN SAFE_DIVIDE(contract_value, original_value) END) AS amend_ratio
        FROM {_t()} WHERE {_yf(y0, y1)} GROUP BY 1, 2),
        hhi_yearly AS (
        SELECT code, year,
        SUM(POW(SAFE_DIVIDE(vendor_spend, total_spend), 2)) AS hhi
        FROM (
            SELECT COALESCE(NULLIF(TRIM(economic_object_code), ''), 'Unknown') AS code,
            EXTRACT(YEAR FROM contract_date) AS year,
            vendor_name, SUM(contract_value) AS vendor_spend,
            SUM(SUM(contract_value)) OVER(PARTITION BY COALESCE(NULLIF(TRIM(economic_object_code), ''), 'Unknown'), EXTRACT(YEAR FROM contract_date)) AS total_spend
            FROM {_t()} WHERE {_yf(y0, y1)} GROUP BY 1, 2, 3
        ) GROUP BY 1, 2),
        bounds AS (
        SELECT code, MIN(year) AS y0, MAX(year) AS y1, COUNT(DISTINCT year) AS n
        FROM yearly GROUP BY code HAVING COUNT(DISTINCT year) >= 3),
        se AS (
        SELECT b.code, b.n,
        MAX(CASE WHEN y.year = b.y0 THEN y.spend END) AS spend0,
        MAX(CASE WHEN y.year = b.y1 THEN y.spend END) AS spend1,
        MAX(CASE WHEN y.year = b.y0 THEN y.cnt END) AS cnt0,
        MAX(CASE WHEN y.year = b.y1 THEN y.cnt END) AS cnt1,
        MAX(CASE WHEN y.year = b.y0 THEN y.avg_val END) AS avg0,
        MAX(CASE WHEN y.year = b.y1 THEN y.avg_val END) AS avg1,
        MAX(CASE WHEN y.year = b.y1 THEN y.spend END) AS latest_spend,
        MAX(CASE WHEN y.year = b.y1 THEN y.cnt END) AS latest_count,
        MAX(CASE WHEN y.year = b.y1 THEN y.avg_val END) AS latest_avg,
        MAX(CASE WHEN y.year = b.y1 THEN y.amend_ratio END) AS latest_amend,
        MAX(CASE WHEN y.year = b.y0 THEN y.amend_ratio END) AS first_amend
        FROM bounds b JOIN yearly y USING(code) GROUP BY b.code, b.n),
        hhi_se AS (
        SELECT h.code,
        MAX(CASE WHEN h.year = b.y0 THEN h.hhi END) AS hhi0,
        MAX(CASE WHEN h.year = b.y1 THEN h.hhi END) AS hhi1
        FROM hhi_yearly h JOIN bounds b USING(code) GROUP BY h.code)
        SELECT se.code,
        ROUND(latest_spend, 0) AS latest_spend, latest_count,
        ROUND(latest_avg, 0) AS latest_avg,
        ROUND(POW(GREATEST(SAFE_DIVIDE(spend1, NULLIF(spend0, 0)), 0.001), SAFE_DIVIDE(1.0, NULLIF(n - 1, 0))) - 1, 4) AS cagr_spend,
        ROUND(POW(GREATEST(SAFE_DIVIDE(CAST(cnt1 AS FLOAT64), NULLIF(CAST(cnt0 AS FLOAT64), 0)), 0.001), SAFE_DIVIDE(1.0, NULLIF(n - 1, 0))) - 1, 4) AS cagr_volume,
        ROUND(POW(GREATEST(SAFE_DIVIDE(avg1, NULLIF(avg0, 0)), 0.001), SAFE_DIVIDE(1.0, NULLIF(n - 1, 0))) - 1, 4) AS cagr_unit,
        ROUND(COALESCE(hhi_se.hhi1, 0), 4) AS latest_hhi,
        ROUND(COALESCE(hhi_se.hhi1, 0) - COALESCE(hhi_se.hhi0, 0), 4) AS hhi_delta,
        ROUND(COALESCE(se.latest_amend, 1), 4) AS latest_amend,
        ROUND(COALESCE(se.latest_amend, 1) - COALESCE(se.first_amend, 1), 4) AS amend_delta
        FROM se LEFT JOIN hhi_se USING(code)
        WHERE spend0 > 0 AND spend1 > 0 ORDER BY latest_spend DESC LIMIT 12""")
    for r in rows:
        r["name"] = EOC_LABELS.get(r["code"], r["code"])
        cu = float(r.get("cagr_unit") or 0)
        cs = float(r.get("cagr_spend") or 0)
        cv = float(r.get("cagr_volume") or 0)
        r["concern_score"] = round((cu * 100 * 1.0 + max(0, cs - cv) * 100 * 0.8), 1)
    rows.sort(key=lambda x: x["concern_score"], reverse=True)
    return rows


def get_contracts_table(search=None, fy=None, eoc=None, sort_key="amendment_ratio", sort_dir="desc", limit=80):
    filters = [_yf(2015, 2025)]
    if fy:
        filters.append(f"EXTRACT(YEAR FROM contract_date) = {int(fy)}")
    if eoc:
        filters.append(f"TRIM(economic_object_code) = '{eoc}'")
    if search:
        s = search.replace("'", "\\'").lower()
        filters.append(f"(LOWER(vendor_name) LIKE '%{s}%' OR LOWER(description_en) LIKE '%{s}%' OR LOWER(reference_number) LIKE '%{s}%')")
    where = " AND ".join(filters)
    allowed = {
        "amendment_ratio": "amr",
        "fiscal_year": "fiscal_year",
        "total_value": "contract_value",
        "original_value": "COALESCE(original_value, contract_value)",
        "vendor": "vendor_name",
    }
    sk = allowed.get(sort_key, "amr")
    sd = "ASC" if sort_dir == "asc" else "DESC"
    return query(f"""SELECT reference_number,
        EXTRACT(YEAR FROM contract_date) AS fiscal_year,
        vendor_name AS vendor,
        COALESCE(NULLIF(TRIM(economic_object_code), ''), '?') AS category_code,
        COALESCE(owner_org, '') AS department,
        COALESCE(NULLIF(TRIM(description_en), ''), 'Contract') AS title,
        ROUND(COALESCE(original_value, contract_value), 0) AS original_value,
        ROUND(contract_value, 0) AS total_value,
        ROUND(CASE WHEN original_value IS NOT NULL AND original_value > 0
            THEN SAFE_DIVIDE(contract_value, original_value) ELSE 1 END, 3) AS amendment_ratio,
        CASE WHEN original_value IS NOT NULL AND original_value > 0
            THEN SAFE_DIVIDE(contract_value, original_value) ELSE 1 END AS amr
        FROM {_t()} WHERE {where} ORDER BY {sk} {sd} NULLS LAST LIMIT {int(limit)}""")


def get_department_spend(y0=2015, y1=2025):
    return query(f"""SELECT COALESCE(owner_org, 'Unknown') AS code,
        COALESCE(owner_org_title, owner_org, 'Unknown') AS name,
        ROUND(SUM(contract_value), 0) AS spend
        FROM {_t()} WHERE {_yf(y0, y1)} GROUP BY 1, 2 ORDER BY spend DESC LIMIT 12""")


def get_watchlist(y0=2015, y1=2025):
    return query(f"""SELECT reference_number,
        EXTRACT(YEAR FROM contract_date) AS fiscal_year,
        vendor_name AS vendor,
        COALESCE(NULLIF(TRIM(economic_object_code), ''), '?') AS category_code,
        COALESCE(NULLIF(TRIM(description_en), ''), 'Contract') AS title,
        COALESCE(NULLIF(TRIM(economic_object_code), ''), 'Unknown') AS category,
        ROUND(COALESCE(original_value, contract_value), 0) AS original_value,
        ROUND(contract_value, 0) AS total_value,
        ROUND(SAFE_DIVIDE(contract_value, original_value), 3) AS amendment_ratio
        FROM {_t()} WHERE {_yf(y0, y1)}
        AND original_value IS NOT NULL AND original_value > 0
        AND SAFE_DIVIDE(contract_value, original_value) > 1.15
        ORDER BY SAFE_DIVIDE(contract_value, original_value) DESC LIMIT 30""")


def get_category_year_rows(eoc, y0=2015, y1=2025):
    rows = query(f"""WITH yearly AS (
        SELECT EXTRACT(YEAR FROM contract_date) AS year,
        ROUND(SUM(contract_value), 0) AS spend, COUNT(*) AS contracts,
        ROUND(AVG(contract_value), 0) AS avg_value,
        ROUND(AVG(CASE WHEN original_value IS NOT NULL AND original_value > 0
            THEN SAFE_DIVIDE(contract_value, original_value) END), 3) AS amendment_ratio
        FROM {_t()} WHERE {_yf(y0, y1)} AND TRIM(economic_object_code) = '{eoc}'
        GROUP BY 1),
        hhi AS (
        SELECT year, SUM(POW(SAFE_DIVIDE(vendor_spend, total_spend), 2)) AS hhi
        FROM (
            SELECT EXTRACT(YEAR FROM contract_date) AS year, vendor_name,
            SUM(contract_value) AS vendor_spend,
            SUM(SUM(contract_value)) OVER(PARTITION BY EXTRACT(YEAR FROM contract_date)) AS total_spend
            FROM {_t()} WHERE {_yf(y0, y1)} AND TRIM(economic_object_code) = '{eoc}'
            GROUP BY 1, 2
        ) GROUP BY 1)
        SELECT y.year, y.spend, y.contracts, y.avg_value,
        ROUND(COALESCE(h.hhi, 0), 4) AS hhi,
        COALESCE(y.amendment_ratio, 1) AS amendment_ratio
        FROM yearly y LEFT JOIN hhi h USING(year) ORDER BY y.year""")
    return rows


def get_vendor_shares(eoc, y0=2015, y1=2025):
    return query(f"""WITH total AS (
        SELECT SUM(contract_value) AS t
        FROM {_t()} WHERE {_yf(y0, y1)} AND TRIM(economic_object_code) = '{eoc}')
        SELECT vendor_name AS vendor, ROUND(SUM(contract_value), 0) AS spend,
        ROUND(SAFE_DIVIDE(SUM(contract_value), (SELECT t FROM total)), 4) AS share
        FROM {_t()} WHERE {_yf(y0, y1)} AND TRIM(economic_object_code) = '{eoc}'
        GROUP BY 1 ORDER BY spend DESC LIMIT 10""")


def get_geography(y0=2015, y1=2025):
    rows = query(f"""WITH provs AS (
        SELECT CASE
            WHEN UPPER(SUBSTR(TRIM(vendor_postal_code), 1, 1)) = 'A' THEN 'NL'
            WHEN UPPER(SUBSTR(TRIM(vendor_postal_code), 1, 1)) = 'B' THEN 'NS'
            WHEN UPPER(SUBSTR(TRIM(vendor_postal_code), 1, 1)) = 'C' THEN 'PE'
            WHEN UPPER(SUBSTR(TRIM(vendor_postal_code), 1, 1)) = 'E' THEN 'NB'
            WHEN UPPER(SUBSTR(TRIM(vendor_postal_code), 1, 1)) IN ('G','H','J') THEN 'QC'
            WHEN UPPER(SUBSTR(TRIM(vendor_postal_code), 1, 1)) IN ('K','L','M','N','P') THEN 'ON'
            WHEN UPPER(SUBSTR(TRIM(vendor_postal_code), 1, 1)) = 'R' THEN 'MB'
            WHEN UPPER(SUBSTR(TRIM(vendor_postal_code), 1, 1)) = 'S' THEN 'SK'
            WHEN UPPER(SUBSTR(TRIM(vendor_postal_code), 1, 1)) = 'T' THEN 'AB'
            WHEN UPPER(SUBSTR(TRIM(vendor_postal_code), 1, 1)) = 'V' THEN 'BC'
            WHEN UPPER(SUBSTR(TRIM(vendor_postal_code), 1, 1)) = 'X' THEN 'NT'
            WHEN UPPER(SUBSTR(TRIM(vendor_postal_code), 1, 1)) = 'Y' THEN 'YT'
            ELSE NULL END AS prov,
        contract_value AS val
        FROM {_t()} WHERE {_yf(y0, y1)}
        AND vendor_postal_code IS NOT NULL AND vendor_postal_code != '')
        SELECT prov AS code, ROUND(SUM(val), 0) AS spend, COUNT(*) AS contracts
        FROM provs WHERE prov IS NOT NULL GROUP BY 1 ORDER BY spend DESC""")
    for r in rows:
        r["name"] = PROV_NAMES.get(r["code"], r["code"])
    return rows
