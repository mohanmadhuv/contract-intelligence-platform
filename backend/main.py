import os
from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from queries import (
    get_overview, get_what_is_bought, get_spend_trend,
    get_growth_ranking, get_volume, get_unit_cost,
    get_amendments, get_concentration, get_less_for_more,
    get_topline_trend, get_category_summaries,
    get_contracts_table, get_department_spend, get_watchlist,
)

app = FastAPI(title="Contract Intelligence API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants for default fiscal year range
YF = 2015
YT = 2025

@app.get("/api/overview")
def overview():
    return get_overview()

@app.get("/api/what-is-bought")
def what_is_bought(year_from: int = Query(YF), year_to: int = Query(YT)):
    return get_what_is_bought(year_from, year_to)

@app.get("/api/spend-trend")
def spend_trend(
    commodity_type: str = Query(None),
    year_from: int = Query(YF),
    year_to: int = Query(YT)
):
    return get_spend_trend(commodity_type, year_from, year_to)

@app.get("/api/growth-ranking")
def growth_ranking(year_from: int = Query(YF), year_to: int = Query(YT)):
    return get_growth_ranking(year_from, year_to)

@app.get("/api/volume")
def volume(year_from: int = Query(YF), year_to: int = Query(YT)):
    return get_volume(year_from, year_to)

@app.get("/api/unit-cost")
def unit_cost(year_from: int = Query(YF), year_to: int = Query(YT)):
    return get_unit_cost(year_from, year_to)

@app.get("/api/amendments")
def amendments():
    return get_amendments()

@app.get("/api/concentration")
def concentration(commodity_type: str = Query(None)):
    return get_concentration(commodity_type)

@app.get("/api/less-for-more")
def less_for_more():
    return get_less_for_more()

@app.get("/api/topline-trend")
def topline_trend():
    return get_topline_trend()

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

# Serve Frontend Static Files
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.isfile(index_path):
            return FileResponse(index_path)
        raise HTTPException(status_code=404, detail="Frontend not built")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
