import logging

from fastapi import APIRouter, HTTPException

from models.schemas import ErrorResponse, GhProjectRequest, GhProjectResponse
from services.github_graphql_client import (
    TOKEN_NOT_SET_ERROR,
    GitHubApiError,
    fetch_project_items,
)
from services.project_url_parser import ProjectUrlParseError, get_github_token, parse_project_url
from services.task_normalizer import normalize_issue_nodes

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["github"])


@router.post(
    "/gh",
    response_model=GhProjectResponse,
    responses={
        400: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
    },
)
async def fetch_github_project(request: GhProjectRequest) -> GhProjectResponse:
    token = get_github_token()
    if not token:
        raise HTTPException(status_code=500, detail={"error": TOKEN_NOT_SET_ERROR})

    try:
        project_ref = parse_project_url(request.project_url)
    except ProjectUrlParseError as exc:
        raise HTTPException(status_code=400, detail={"error": str(exc)}) from exc

    estimate_field = request.estimate_field.strip() or "Estimate"

    try:
        nodes = await fetch_project_items(project_ref, estimate_field, token)
    except GitHubApiError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail={"error": str(exc)},
        ) from exc

    tasks = normalize_issue_nodes(nodes, estimate_field)
    return GhProjectResponse(tasks=tasks)
