"""Contract Intelligence API — FastAPI backend"""
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from queries import (
    get_overview, get_what_is_bought, get_spend_trend,
    get_growth_ranking, get_volume, get_unit_cost,
    get_amendments, get_concentration, get_less_for_more,
    get_topline_trend, get_category_summaries,
    get_contracts_table, get_department_spend, get_watchlist,
)

app = FastAPI(title="Contract Intelligence API", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
YF, YT = 2015, 2025

@app.get("/")
def root():
    return {"status": "ok", "message": "Contract Intelligence API v2"}

# ── Original endpoints ──
@app.get("/api/overview")
def overview(year_from: int = Query(YF), year_to: int = Query(YT)):
    return get_overview(year_from, year_to)

@app.get("/api/what-is-bought")
def what_is_bought(year_from: int = Query(YF), year_to: int = Query(YT)):
    return get_what_is_bought(year_from, year_to)

@app.get("/api/spend-trend")
def spend_trend(year_from: int = Query(YF), year_to: int = Query(YT), category: str = Query(None)):
    return get_spend_trend(year_from, year_to, category)

@app.get("/api/growth-ranking")
def growth_ranking(year_from: int = Query(YF), year_to: int = Query(YT)):
    return get_growth_ranking(year_from, year_to)

@app.get("/api/volume")
def volume(year_from: int = Query(YF), year_to: int = Query(YT), category: str = Query(None)):
    return get_volume(year_from, year_to, category)

@app.get("/api/unit-cost")
def unit_cost(year_from: int = Query(YF), year_to: int = Query(YT), category: str = Query(None)):
    return get_unit_cost(year_from, year_to, category)

@app.get("/api/amendments")
def amendments(year_from: int = Query(YF), year_to: int = Query(YT), category: str = Query(None)):
    return get_amendments(year_from, year_to, category)

@app.get("/api/concentration")
def concentration(year_from: int = Query(YF), year_to: int = Query(YT), category: str = Query(None)):
    return get_concentration(year_from, year_to, category)

@app.get("/api/less-for-more")
def less_for_more(year_from: int = Query(YF), year_to: int = Query(YT)):
    return get_less_for_more(year_from, year_to)

# ── New dashboard endpoints ──
@app.get("/api/topline-trend")
def topline_trend(year_from: int = Query(YF), year_to: int = Query(YT)):
    return get_topline_trend(year_from, year_to)

@app.get("/api/category-summaries")
def category_summaries(year_from: int = Query(YF), year_to: int = Query(YT)):
    return get_category_summaries(year_from, year_to)


@app.get("/api/contracts")
def contracts_table(search: str = Query(None), fy: int = Query(None), eoc: str = Query(None),
                    sort_key: str = Query("amendment_ratio"), sort_dir: str = Query("desc"), limit: int = Query(80)):
    return get_contracts_table(search, fy, eoc, sort_key, sort_dir, limit)

@app.get("/api/departments")
def departments(year_from: int = Query(YF), year_to: int = Query(YT)):
    return get_department_spend(year_from, year_to)

@app.get("/api/watchlist")
def watchlist():
    return get_watchlist()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
