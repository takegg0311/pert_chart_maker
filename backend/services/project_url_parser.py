import logging
import os
import re
from dataclasses import dataclass
from typing import Literal

logger = logging.getLogger(__name__)

USER_PROJECT_PATTERN = re.compile(
    r"^https://github\.com/users/(?P<login>[^/]+)/projects/(?P<number>\d+)/?$"
)
ORG_PROJECT_PATTERN = re.compile(
    r"^https://github\.com/orgs/(?P<login>[^/]+)/projects/(?P<number>\d+)/?$"
)

OwnerType = Literal["user", "organization"]


@dataclass(frozen=True)
class ProjectRef:
    owner_type: OwnerType
    login: str
    number: int


class ProjectUrlParseError(ValueError):
    pass


def parse_project_url(project_url: str) -> ProjectRef:
    url = project_url.strip()
    match = USER_PROJECT_PATTERN.match(url)
    if match:
        return ProjectRef(
            owner_type="user",
            login=match.group("login"),
            number=int(match.group("number")),
        )

    match = ORG_PROJECT_PATTERN.match(url)
    if match:
        return ProjectRef(
            owner_type="organization",
            login=match.group("login"),
            number=int(match.group("number")),
        )

    raise ProjectUrlParseError("Project URL の形式が正しくありません")


def get_github_token() -> str | None:
    return os.getenv("GITHUB_TOKEN") or None
