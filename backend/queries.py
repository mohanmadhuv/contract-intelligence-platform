"""
All analytics queries for Contract Intelligence.
NOTE: All DB columns are TEXT — every numeric reference must cast ::numeric.
"""
from db import query

TABLE = "contracts"

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

def _yf(y0, y1):
    return f"""contract_date IS NOT NULL AND contract_date!='' AND contract_value IS NOT NULL AND contract_value!='' AND contract_value::numeric>0 AND EXTRACT(YEAR FROM contract_date::date) BETWEEN {y0} AND {y1}"""

# ── Overview ──
def get_overview(y0=2015,y1=2025):
    r=query(f"""SELECT COUNT(*) AS total_contracts, ROUND(SUM(contract_value::numeric)::numeric,0) AS total_spend_cad,
        COUNT(DISTINCT vendor_name) AS unique_vendors, COUNT(DISTINCT owner_org) AS departments,
        MIN(EXTRACT(YEAR FROM contract_date::date))::int AS year_min, MAX(EXTRACT(YEAR FROM contract_date::date))::int AS year_max,
        ROUND(AVG(contract_value::numeric)::numeric,0) AS avg_contract_value,
        COUNT(*) FILTER(WHERE LOWER(solicitation_procedure) LIKE '%%non-comp%%' OR LOWER(solicitation_procedure) LIKE '%%sole%%' OR LOWER(solicitation_procedure) LIKE '%%acan%%')*100.0/NULLIF(COUNT(*),0) AS sole_source_pct
        FROM {TABLE} WHERE {_yf(y0,y1)}""")
    return r[0] if r else {}

# ── What is bought ──
def get_what_is_bought(y0=2015,y1=2025):
    commodity=query(f"""SELECT COALESCE(NULLIF(TRIM(commodity_type),''),'Unknown') AS category, COUNT(*) AS contracts,
        ROUND(SUM(contract_value::numeric)::numeric,0) AS spend, COUNT(DISTINCT vendor_name) AS vendors
        FROM {TABLE} WHERE {_yf(y0,y1)} GROUP BY 1 ORDER BY spend DESC""")
    eoc=query(f"""SELECT COALESCE(NULLIF(TRIM(economic_object_code),''),'Unknown') AS code, COUNT(*) AS contracts,
        ROUND(SUM(contract_value::numeric)::numeric,0) AS spend
        FROM {TABLE} WHERE {_yf(y0,y1)} AND economic_object_code IS NOT NULL GROUP BY 1 ORDER BY spend DESC LIMIT 15""")
    for r in eoc: r["label"]=EOC_LABELS.get(r["code"],r["code"])
    for r in commodity: r["label"]=COMMODITY_LABELS.get(r["category"],r["category"])
    return {"commodity_breakdown":commodity,"top_eoc":eoc}

# ── Spend trend ──
def get_spend_trend(y0=2015,y1=2025,category=None):
    cat=f"AND TRIM(commodity_type)='{category}'" if category else ""
    return query(f"""WITH y AS (SELECT EXTRACT(YEAR FROM contract_date::date)::int AS year, COUNT(*) AS contracts,
        ROUND(SUM(contract_value::numeric)::numeric,0) AS spend, ROUND(AVG(contract_value::numeric)::numeric,0) AS avg_value
        FROM {TABLE} WHERE {_yf(y0,y1)} {cat} GROUP BY 1)
        SELECT *, ROUND((spend-LAG(spend) OVER(ORDER BY year))/NULLIF(LAG(spend) OVER(ORDER BY year),0)*100::numeric,1) AS yoy_growth_pct FROM y ORDER BY year""")

# ── Growth ranking ──
def get_growth_ranking(y0=2015,y1=2025):
    rows=query(f"""WITH yearly AS (SELECT COALESCE(NULLIF(TRIM(commodity_type),''),'Unknown') AS category,
        EXTRACT(YEAR FROM contract_date::date)::int AS year, SUM(contract_value::numeric) AS spend
        FROM {TABLE} WHERE {_yf(y0,y1)} GROUP BY 1,2),
        bounds AS (SELECT category, MIN(year) AS ys, MAX(year) AS ye, MAX(year)-MIN(year) AS n FROM yearly GROUP BY category),
        se AS (SELECT b.category, b.n, MAX(CASE WHEN y.year=b.ys THEN y.spend END) AS s0, MAX(CASE WHEN y.year=b.ye THEN y.spend END) AS s1
        FROM bounds b JOIN yearly y USING(category) GROUP BY b.category, b.n)
        SELECT category, ROUND(s0::numeric,0) AS spend_start, ROUND(s1::numeric,0) AS spend_end,
        ROUND(((s1-s0)/NULLIF(s0,0))*100::numeric,1) AS total_growth_pct,
        ROUND((POWER(s1/NULLIF(s0,0.001),1.0/NULLIF(n,1))-1)*100::numeric,1) AS cagr_pct
        FROM se WHERE s0>0 AND s1>0 ORDER BY cagr_pct DESC NULLS LAST LIMIT 20""")
    for r in rows: r["category_label"]=COMMODITY_LABELS.get(r["category"],r["category"])
    return rows

# ── Volume ──
def get_volume(y0=2015,y1=2025,category=None):
    cat=f"AND TRIM(commodity_type)='{category}'" if category else ""
    return query(f"""SELECT EXTRACT(YEAR FROM contract_date::date)::int AS year,
        COALESCE(NULLIF(TRIM(commodity_type),''),'Unknown') AS category, COUNT(*) AS contract_count,
        COUNT(DISTINCT vendor_name) AS vendor_count FROM {TABLE} WHERE {_yf(y0,y1)} {cat} GROUP BY 1,2 ORDER BY 1""")

# ── Unit cost ──
def get_unit_cost(y0=2015,y1=2025,category=None):
    cat=f"AND TRIM(commodity_type)='{category}'" if category else ""
    yearly=query(f"""WITH y AS (SELECT EXTRACT(YEAR FROM contract_date::date)::int AS year,
        ROUND(AVG(contract_value::numeric)::numeric,0) AS avg_value,
        ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP(ORDER BY contract_value::numeric)::numeric,0) AS median_value,
        ROUND(SUM(contract_value::numeric)::numeric,0) AS total_spend, COUNT(*) AS contracts
        FROM {TABLE} WHERE {_yf(y0,y1)} {cat} GROUP BY 1)
        SELECT *, ROUND((avg_value-LAG(avg_value) OVER(ORDER BY year))/NULLIF(LAG(avg_value) OVER(ORDER BY year),0)*100::numeric,1) AS avg_value_yoy_pct FROM y ORDER BY year""")
    return {"yearly":yearly,"top_categories":[]}

# ── Amendments ──
def get_amendments(y0=2015,y1=2025,category=None):
    cat=f"AND TRIM(commodity_type)='{category}'" if category else ""
    yearly=query(f"""SELECT EXTRACT(YEAR FROM contract_date::date)::int AS year,
        COUNT(*) FILTER(WHERE original_value IS NOT NULL AND original_value!='' AND original_value::numeric>0) AS amended_contracts,
        ROUND(AVG(CASE WHEN original_value IS NOT NULL AND original_value!='' AND original_value::numeric>0 THEN contract_value::numeric/original_value::numeric END)::numeric,3) AS avg_inflation_ratio,
        ROUND(SUM(contract_value::numeric - COALESCE(NULLIF(original_value,'')::numeric, contract_value::numeric))::numeric,0) AS total_amendment_value
        FROM {TABLE} WHERE {_yf(y0,y1)} {cat} GROUP BY 1 ORDER BY 1""")
    return {"yearly":yearly,"top_amended":[]}

# ── Concentration ──
def get_concentration(y0=2015,y1=2025,category=None):
    cat=f"AND TRIM(commodity_type)='{category}'" if category else ""
    top_vendors=query(f"""WITH t AS (SELECT SUM(contract_value::numeric) AS gt FROM {TABLE} WHERE {_yf(y0,y1)} {cat})
        SELECT vendor_name, COUNT(*) AS contracts, ROUND(SUM(contract_value::numeric)::numeric,0) AS spend,
        ROUND(SUM(contract_value::numeric)/MAX(gt)*100::numeric,2) AS market_share_pct
        FROM {TABLE}, t WHERE {_yf(y0,y1)} {cat} GROUP BY vendor_name ORDER BY spend DESC LIMIT 15""")
    hhi_trend=query(f"""WITH yearly_vendor_spend AS (
        SELECT EXTRACT(YEAR FROM contract_date::date)::int AS year, vendor_name,
        SUM(contract_value::numeric) AS spend
        FROM {TABLE} WHERE {_yf(y0,y1)} {cat} GROUP BY 1, 2
        ),
        sh AS (
        SELECT year, vendor_name,
        spend / NULLIF(SUM(spend) OVER(PARTITION BY year),0) AS share
        FROM yearly_vendor_spend
        )
        SELECT year, ROUND(SUM(POWER(share,2))::numeric,4) AS hhi, COUNT(DISTINCT vendor_name) AS vendor_count 
        FROM sh GROUP BY year ORDER BY year""")
    return {"top_vendors":top_vendors,"hhi_trend":hhi_trend}

# ── Less for more ──
def get_less_for_more(y0=2015,y1=2025):
    rows=query(f"""WITH base AS (
        SELECT COALESCE(NULLIF(TRIM(commodity_type),''),'Unknown') AS category,
        EXTRACT(YEAR FROM contract_date::date)::int AS year,
        SUM(contract_value::numeric) AS spend, COUNT(*) AS contracts, AVG(contract_value::numeric) AS avg_value,
        AVG(CASE WHEN original_value IS NOT NULL AND original_value!='' AND original_value::numeric>0 THEN contract_value::numeric/original_value::numeric END) AS inflation_ratio,
        COUNT(*) FILTER(WHERE LOWER(solicitation_procedure) LIKE '%%non-comp%%' OR LOWER(solicitation_procedure) LIKE '%%sole%%' OR LOWER(solicitation_procedure) LIKE '%%acan%%')*100.0/NULLIF(COUNT(*),0) AS sole_source_pct
        FROM {TABLE} WHERE {_yf(y0,y1)} GROUP BY 1,2),
        fl AS (SELECT category, SUM(spend) AS total_spend, AVG(sole_source_pct) AS avg_sole_pct, AVG(inflation_ratio) AS avg_inflation,
        MIN(CASE WHEN year=(SELECT MIN(year) FROM base b2 WHERE b2.category=base.category) THEN spend END) AS s0,
        MAX(CASE WHEN year=(SELECT MAX(year) FROM base b2 WHERE b2.category=base.category) THEN spend END) AS s1,
        MIN(CASE WHEN year=(SELECT MIN(year) FROM base b2 WHERE b2.category=base.category) THEN avg_value END) AS c0,
        MAX(CASE WHEN year=(SELECT MAX(year) FROM base b2 WHERE b2.category=base.category) THEN avg_value END) AS c1
        FROM base GROUP BY category)
        SELECT category, ROUND(total_spend::numeric,0) AS total_spend,
        ROUND((s1-s0)/NULLIF(s0,0)*100::numeric,1) AS spend_growth_pct,
        ROUND((c1-c0)/NULLIF(c0,0)*100::numeric,1) AS unit_cost_growth_pct,
        ROUND(avg_sole_pct::numeric,1) AS sole_source_pct,
        ROUND(avg_inflation::numeric,3) AS amendment_inflation_ratio
        FROM fl WHERE s0>0 AND s1>0 ORDER BY spend_growth_pct DESC NULLS LAST LIMIT 20""")
    for r in rows:
        r["category_label"]=COMMODITY_LABELS.get(r["category"],r["category"])
        sg=float(r["spend_growth_pct"] or 0); cg=float(r["unit_cost_growth_pct"] or 0)
        ss=float(r["sole_source_pct"] or 0); ai=float(r["amendment_inflation_ratio"] or 1)-1
        r["erosion_score"]=round(0.3*sg+0.25*cg+0.2*ss+0.15*ai*100,1)
    rows.sort(key=lambda r: r["erosion_score"], reverse=True)
    return rows

# ═══════════════════════ NEW DASHBOARD ENDPOINTS ═══════════════════════

def get_topline_trend(y0=2015,y1=2025):
    return query(f"""SELECT EXTRACT(YEAR FROM contract_date::date)::int AS fiscal_year,
        ROUND(SUM(contract_value::numeric)::numeric,0) AS total_spend, COUNT(*) AS contract_count,
        ROUND(AVG(contract_value::numeric)::numeric,0) AS avg_contract_value,
        ROUND(AVG(CASE WHEN original_value IS NOT NULL AND original_value!='' AND original_value::numeric>0 THEN contract_value::numeric/original_value::numeric END)::numeric,4) AS avg_amendment
        FROM {TABLE} WHERE {_yf(y0,y1)} GROUP BY 1 ORDER BY 1""")

def get_category_summaries(y0=2015,y1=2025):
    rows=query(f"""WITH yearly AS (
        SELECT COALESCE(NULLIF(TRIM(economic_object_code),''),'Unknown') AS code,
        EXTRACT(YEAR FROM contract_date::date)::int AS year,
        SUM(contract_value::numeric) AS spend, COUNT(*) AS cnt, AVG(contract_value::numeric) AS avg_val
        FROM {TABLE} WHERE {_yf(y0,y1)} GROUP BY 1,2),
        bounds AS (SELECT code, MIN(year) AS y0, MAX(year) AS y1, COUNT(DISTINCT year) AS n FROM yearly GROUP BY code HAVING COUNT(DISTINCT year)>=3),
        se AS (SELECT b.code, b.n,
        MAX(CASE WHEN y.year=b.y0 THEN y.spend END) AS spend0, MAX(CASE WHEN y.year=b.y1 THEN y.spend END) AS spend1,
        MAX(CASE WHEN y.year=b.y0 THEN y.cnt END) AS cnt0, MAX(CASE WHEN y.year=b.y1 THEN y.cnt END) AS cnt1,
        MAX(CASE WHEN y.year=b.y0 THEN y.avg_val END) AS avg0, MAX(CASE WHEN y.year=b.y1 THEN y.avg_val END) AS avg1,
        MAX(CASE WHEN y.year=b.y1 THEN y.spend END) AS latest_spend,
        MAX(CASE WHEN y.year=b.y1 THEN y.cnt END) AS latest_count,
        MAX(CASE WHEN y.year=b.y1 THEN y.avg_val END) AS latest_avg
        FROM bounds b JOIN yearly y USING(code) GROUP BY b.code, b.n)
        SELECT code, ROUND(latest_spend::numeric,0) AS latest_spend, latest_count,
        ROUND(latest_avg::numeric,0) AS latest_avg,
        ROUND((POWER(GREATEST(spend1/NULLIF(spend0,0.001),0.001),1.0/NULLIF(n-1,1))-1)::numeric,4) AS cagr_spend,
        ROUND((POWER(GREATEST(cnt1::float/NULLIF(cnt0::float,0.001),0.001),1.0/NULLIF(n-1,1))-1)::numeric,4) AS cagr_volume,
        ROUND((POWER(GREATEST(avg1/NULLIF(avg0,0.001),0.001),1.0/NULLIF(n-1,1))-1)::numeric,4) AS cagr_unit
        FROM se WHERE spend0>0 AND spend1>0 ORDER BY latest_spend DESC LIMIT 12""")
    for r in rows:
        r["name"]=EOC_LABELS.get(r["code"],r["code"])
        cu=float(r.get("cagr_unit") or 0); cs=float(r.get("cagr_spend") or 0); cv=float(r.get("cagr_volume") or 0)
        r["concern_score"]=round((cu*100*1.0+max(0,cs-cv)*100*0.8),1)
    rows.sort(key=lambda x: x["concern_score"], reverse=True)
    return rows

def get_contracts_table(search=None,fy=None,eoc=None,sort_key="amendment_ratio",sort_dir="desc",limit=80):
    filters=[_yf(2015,2025)]
    if fy: filters.append(f"EXTRACT(YEAR FROM contract_date::date)::int={int(fy)}")
    if eoc: filters.append(f"TRIM(economic_object_code)='{eoc}'")
    if search:
        s=search.replace("'","''").lower()
        filters.append(f"(LOWER(vendor_name) LIKE '%%{s}%%' OR LOWER(description_en) LIKE '%%{s}%%' OR LOWER(reference_number) LIKE '%%{s}%%')")
    where=" AND ".join(filters)
    allowed={"amendment_ratio":"amr","fiscal_year":"fiscal_year","total_value":"contract_value::numeric","original_value":"COALESCE(NULLIF(original_value,'')::numeric,contract_value::numeric)","vendor":"vendor_name"}
    sk=allowed.get(sort_key,"amr")
    sd="ASC" if sort_dir=="asc" else "DESC"
    return query(f"""SELECT reference_number, EXTRACT(YEAR FROM contract_date::date)::int AS fiscal_year,
        vendor_name AS vendor, COALESCE(NULLIF(TRIM(economic_object_code),''),'?') AS category_code,
        COALESCE(owner_org,'') AS department, COALESCE(NULLIF(TRIM(description_en),''),'Contract') AS title,
        ROUND(COALESCE(NULLIF(original_value,'')::numeric, contract_value::numeric)::numeric,0) AS original_value,
        ROUND(contract_value::numeric::numeric,0) AS total_value,
        ROUND((CASE WHEN original_value IS NOT NULL AND original_value!='' AND original_value::numeric>0 THEN contract_value::numeric/original_value::numeric ELSE 1 END)::numeric,3) AS amendment_ratio,
        (CASE WHEN original_value IS NOT NULL AND original_value!='' AND original_value::numeric>0 THEN contract_value::numeric/original_value::numeric ELSE 1 END) AS amr
        FROM {TABLE} WHERE {where} ORDER BY {sk} {sd} NULLS LAST LIMIT {int(limit)}""")

def get_department_spend(y0=2015,y1=2025):
    return query(f"""SELECT COALESCE(owner_org,'Unknown') AS code, COALESCE(owner_org_title, owner_org, 'Unknown') AS name,
        ROUND(SUM(contract_value::numeric)::numeric,0) AS spend
        FROM {TABLE} WHERE {_yf(y0,y1)} GROUP BY 1,2 ORDER BY spend DESC LIMIT 12""")

def get_watchlist(y0=2015,y1=2025):
    return query(f"""SELECT reference_number, EXTRACT(YEAR FROM contract_date::date)::int AS fiscal_year,
        vendor_name AS vendor, COALESCE(NULLIF(TRIM(economic_object_code),''),'?') AS category_code,
        COALESCE(NULLIF(TRIM(description_en),''),'Contract') AS title,
        ROUND(COALESCE(NULLIF(original_value,'')::numeric, contract_value::numeric)::numeric,0) AS original_value,
        ROUND(contract_value::numeric::numeric,0) AS total_value,
        ROUND((contract_value::numeric/original_value::numeric)::numeric,3) AS amendment_ratio
        FROM {TABLE} WHERE {_yf(y0,y1)} AND original_value IS NOT NULL AND original_value!='' AND original_value::numeric>0 AND contract_value::numeric/original_value::numeric>1.15
        ORDER BY contract_value::numeric/original_value::numeric DESC LIMIT 30""")

def get_category_year_rows(eoc, y0=2015, y1=2025):
    return query(f"""SELECT EXTRACT(YEAR FROM contract_date::date)::int AS year,
        ROUND(SUM(contract_value::numeric)::numeric,0) AS spend, COUNT(*) AS contracts,
        ROUND(AVG(contract_value::numeric)::numeric,0) AS avg_value
        FROM {TABLE} WHERE {_yf(y0,y1)} AND TRIM(economic_object_code)='{eoc}'
        GROUP BY 1 ORDER BY 1""")

def get_vendor_shares(eoc, y0=2015, y1=2025):
    return query(f"""WITH total AS (SELECT SUM(contract_value::numeric) AS t FROM {TABLE} WHERE {_yf(y0,y1)} AND TRIM(economic_object_code)='{eoc}')
        SELECT vendor_name, ROUND(SUM(contract_value::numeric)::numeric,0) AS spend,
        ROUND((SUM(contract_value::numeric)/(SELECT t FROM total)*100)::numeric,1) AS market_share_pct
        FROM {TABLE} WHERE {_yf(y0,y1)} AND TRIM(economic_object_code)='{eoc}'
        GROUP BY 1 ORDER BY spend DESC LIMIT 10""")

def get_geography(y0=2015, y1=2025):
    return query(f"""WITH provs AS (
        SELECT CASE 
            WHEN UPPER(SUBSTRING(TRIM(vendor_postal_code) FROM 1 FOR 1)) = 'A' THEN 'NL'
            WHEN UPPER(SUBSTRING(TRIM(vendor_postal_code) FROM 1 FOR 1)) = 'B' THEN 'NS'
            WHEN UPPER(SUBSTRING(TRIM(vendor_postal_code) FROM 1 FOR 1)) = 'C' THEN 'PE'
            WHEN UPPER(SUBSTRING(TRIM(vendor_postal_code) FROM 1 FOR 1)) = 'E' THEN 'NB'
            WHEN UPPER(SUBSTRING(TRIM(vendor_postal_code) FROM 1 FOR 1)) IN ('G','H','J') THEN 'QC'
            WHEN UPPER(SUBSTRING(TRIM(vendor_postal_code) FROM 1 FOR 1)) IN ('K','L','M','N','P') THEN 'ON'
            WHEN UPPER(SUBSTRING(TRIM(vendor_postal_code) FROM 1 FOR 1)) = 'R' THEN 'MB'
            WHEN UPPER(SUBSTRING(TRIM(vendor_postal_code) FROM 1 FOR 1)) = 'S' THEN 'SK'
            WHEN UPPER(SUBSTRING(TRIM(vendor_postal_code) FROM 1 FOR 1)) = 'T' THEN 'AB'
            WHEN UPPER(SUBSTRING(TRIM(vendor_postal_code) FROM 1 FOR 1)) = 'V' THEN 'BC'
            WHEN UPPER(SUBSTRING(TRIM(vendor_postal_code) FROM 1 FOR 1)) = 'X' THEN 'NT'
            WHEN UPPER(SUBSTRING(TRIM(vendor_postal_code) FROM 1 FOR 1)) = 'Y' THEN 'YT'
            ELSE NULL END AS prov,
        contract_value::numeric AS val
        FROM {TABLE} WHERE {_yf(y0,y1)} AND vendor_postal_code IS NOT NULL AND vendor_postal_code != ''
        )
        SELECT prov, ROUND(SUM(val)::numeric,0) AS spend, COUNT(*) AS contracts
        FROM provs WHERE prov IS NOT NULL GROUP BY 1 ORDER BY spend DESC
    """)
