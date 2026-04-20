from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, extract, profiles, resume
from app.core.config import get_settings
from app.services.db import init_db

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
)

init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume.router, prefix="/api/v1")
app.include_router(extract.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(profiles.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "version": settings.app_version}
