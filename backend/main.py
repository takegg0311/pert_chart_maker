import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers.gh import router as gh_router
from services.project_url_parser import get_github_token

load_dotenv()

logger = logging.getLogger(__name__)

DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "https://pert-chart.web.app",
]


def _get_cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS")
    if not raw:
        return DEFAULT_CORS_ORIGINS
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


@asynccontextmanager
async def lifespan(_: FastAPI):
    if not get_github_token():
        logger.warning("GITHUB_TOKEN is not set. POST /api/gh will fail.")
    yield


app = FastAPI(title="PERT Chart Maker API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(gh_router)


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"error": str(exc.detail)})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=400,
        content={"error": "リクエストの形式が正しくありません"},
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
