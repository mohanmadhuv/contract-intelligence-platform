import os
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from queries import (
    get_overview, get_what_is_bought, get_spend_trend,
    get_growth_ranking, get_volume, get_unit_cost,
    get_amendments, get_concentration, get_less_for_more,
    get_topline_trend, get_category_summaries,
    get_contracts_table, get_department_spend, get_watchlist,
    get_category_year_rows, get_vendor_shares, get_geography,
)
from chat import chat as ai_chat

app = FastAPI(title="Contract Intelligence API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Default fiscal year range
YF = 2015
YT = 2025


# ── Health check ──
@app.get("/")
def root():
    return {"status": "ok", "service": "Contract Intelligence API", "version": "3.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy", "database": "connected"}


# ── Chat ──
class ChatRequest(BaseModel):
    message: str
    history: list = []

@app.post("/api/chat")
def chat_endpoint(req: ChatRequest):
    return ai_chat(req.message, req.history)


# ── Analytics endpoints ──
@app.get("/api/overview")
def overview(year_from: int = Query(YF), year_to: int = Query(YT)):
    return get_overview(year_from, year_to)

@app.get("/api/what-is-bought")
def what_is_bought(year_from: int = Query(YF), year_to: int = Query(YT)):
    return get_what_is_bought(year_from, year_to)

@app.get("/api/spend-trend")
def spend_trend(commodity_type: str = Query(None), year_from: int = Query(YF), year_to: int = Query(YT)):
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
def amendments(year_from: int = Query(YF), year_to: int = Query(YT)):
    return get_amendments(year_from, year_to)

@app.get("/api/concentration")
def concentration(commodity_type: str = Query(None), year_from: int = Query(YF), year_to: int = Query(YT)):
    return get_concentration(year_from, year_to, category=commodity_type)

@app.get("/api/less-for-more")
def less_for_more(year_from: int = Query(YF), year_to: int = Query(YT)):
    return get_less_for_more(year_from, year_to)

@app.get("/api/topline-trend")
def topline_trend(year_from: int = Query(YF), year_to: int = Query(YT)):
    return get_topline_trend(year_from, year_to)

@app.get("/api/category-summaries")
def category_summaries(year_from: int = Query(YF), year_to: int = Query(YT)):
    return get_category_summaries(year_from, year_to)

@app.get("/api/category-year-rows")
def category_year_rows(code: str = Query(...), year_from: int = Query(YF), year_to: int = Query(YT)):
    return get_category_year_rows(code, year_from, year_to)

@app.get("/api/vendor-shares")
def vendor_shares(code: str = Query(...), year_from: int = Query(YF), year_to: int = Query(YT)):
    return get_vendor_shares(code, year_from, year_to)

@app.get("/api/geography")
def geography(year_from: int = Query(YF), year_to: int = Query(YT)):
    return get_geography(year_from, year_to)

@app.get("/api/contracts")
def contracts_table(search: str = Query(None), fy: int = Query(None), eoc: str = Query(None),
                    sort_key: str = Query("amendment_ratio"), sort_dir: str = Query("desc"), limit: int = Query(80)):
    return get_contracts_table(search, fy, eoc, sort_key, sort_dir, limit)

@app.get("/api/departments")
def departments(year_from: int = Query(YF), year_to: int = Query(YT)):
    return get_department_spend(year_from, year_to)

@app.get("/api/watchlist")
def watchlist(year_from: int = Query(YF), year_to: int = Query(YT)):
    return get_watchlist(year_from, year_to)


# ── Serve Frontend Static Files ──
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
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
