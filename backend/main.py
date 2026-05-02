import sys
import os

# Add backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import ingest, review, business, alerts

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TRACEX API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router,   prefix="/api/ingest",   tags=["Ingest"])
app.include_router(review.router,   prefix="/api/review",   tags=["Review"])
app.include_router(business.router, prefix="/api/business", tags=["Business"])
app.include_router(alerts.router,   prefix="/api/alerts",   tags=["Alerts"])

@app.get("/")
def root():
    return {"message": "TRACEX API running", "docs": "/docs"}