from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import algorithm, auth, patients, reports
import os

app = FastAPI()

# CORS origins: comma-separated in CORS_ORIGINS env var, or fallback to localhost for dev
_raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(patients.router, prefix="/api/patients", tags=["patients"])
app.include_router(algorithm.router, prefix="/api/algorithm", tags=["algorithm"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])

@app.get("/")
def root():
    return {"message": "MediAlloc API is running"}
