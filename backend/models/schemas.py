from pydantic import BaseModel, Field


class GhProjectRequest(BaseModel):
    project_url: str
    estimate_field: str = Field(default="Estimate")


class GhTask(BaseModel):
    id: str
    name: str
    duration: float
    predecessors: list[str]
    successors: list[str]
    state: str


class GhProjectResponse(BaseModel):
    tasks: list[GhTask]


class ErrorResponse(BaseModel):
    error: str
