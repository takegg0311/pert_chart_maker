import logging
from typing import Any

import httpx

from services.project_url_parser import ProjectRef

logger = logging.getLogger(__name__)

GITHUB_GRAPHQL_URL = "https://api.github.com/graphql"
PRIVATE_PROJECT_ERROR = (
    "このProjectはPrivateか存在しないため取得できませんでした。"
    "ローカル稼働時に自身のGITHUB_TOKENを設定するか、Public Projectを指定してください。"
)
RATE_LIMIT_ERROR = (
    "GitHub API のレート制限に達しました。しばらく待ってから再試行してください"
)
TOKEN_NOT_SET_ERROR = "サーバーに GITHUB_TOKEN が設定されていません"
PROJECT_NOT_FOUND_ERROR = "指定された Project が見つかりません"

ITEMS_PAGE_SIZE = 100
FIELD_VALUES_PAGE_SIZE = 30


class GitHubApiError(Exception):
    def __init__(self, message: str, status_code: int) -> None:
        super().__init__(message)
        self.status_code = status_code


def _build_query(owner_type: str) -> str:
    owner_field = "user" if owner_type == "user" else "organization"
    return f"""
query($login: String!, $number: Int!, $estimateField: String!, $after: String) {{
  {owner_field}(login: $login) {{
    projectV2(number: $number) {{
      items(first: {ITEMS_PAGE_SIZE}, after: $after) {{
        pageInfo {{
          hasNextPage
          endCursor
        }}
        nodes {{
          id
          type
          content {{
            __typename
            ... on Issue {{
              number
              title
              state
              blockedBy(first: 50) {{
                nodes {{
                  number
                }}
              }}
              blocking(first: 50) {{
                nodes {{
                  number
                }}
              }}
            }}
          }}
          fieldValueByName(name: $estimateField) {{
            __typename
            ... on ProjectV2ItemFieldNumberValue {{
              number
            }}
          }}
          fieldValues(first: {FIELD_VALUES_PAGE_SIZE}) {{
            nodes {{
              __typename
              ... on ProjectV2ItemFieldTextValue {{
                text
                field {{
                  ... on ProjectV2Field {{
                    name
                  }}
                }}
              }}
              ... on ProjectV2ItemFieldNumberValue {{
                number
                field {{
                  ... on ProjectV2Field {{
                    name
                  }}
                }}
              }}
              ... on ProjectV2ItemFieldSingleSelectValue {{
                name
                field {{
                  ... on ProjectV2SingleSelectField {{
                    name
                  }}
                }}
              }}
            }}
          }}
        }}
      }}
    }}
  }}
}}
"""


async def fetch_project_items(
    project_ref: ProjectRef,
    estimate_field: str,
    token: str,
) -> list[dict[str, Any]]:
    query = _build_query(project_ref.owner_type)
    all_nodes: list[dict[str, Any]] = []
    after: str | None = None

    async with httpx.AsyncClient(timeout=30.0) as client:
        while True:
            variables = {
                "login": project_ref.login,
                "number": project_ref.number,
                "estimateField": estimate_field,
                "after": after,
            }
            response = await client.post(
                GITHUB_GRAPHQL_URL,
                json={"query": query, "variables": variables},
                headers={
                    "Authorization": f"bearer {token}",
                    "Content-Type": "application/json",
                },
            )

            if response.status_code == 403:
                raise GitHubApiError(PRIVATE_PROJECT_ERROR, 403)
            if response.status_code == 429:
                raise GitHubApiError(RATE_LIMIT_ERROR, 429)
            if response.status_code >= 400:
                raise GitHubApiError(
                    f"GitHub API エラー: HTTP {response.status_code}",
                    502,
                )

            payload = response.json()
            _raise_for_graphql_errors(payload)

            owner_field = "user" if project_ref.owner_type == "user" else "organization"
            owner_data = payload.get("data", {}).get(owner_field)
            if owner_data is None:
                raise GitHubApiError(PRIVATE_PROJECT_ERROR, 403)

            project_v2 = owner_data.get("projectV2")
            if project_v2 is None:
                raise GitHubApiError(PROJECT_NOT_FOUND_ERROR, 404)

            items = project_v2.get("items", {})
            nodes = items.get("nodes") or []
            all_nodes.extend(nodes)

            page_info = items.get("pageInfo", {})
            if not page_info.get("hasNextPage"):
                break
            after = page_info.get("endCursor")
            if not after:
                break

    return all_nodes


def _raise_for_graphql_errors(payload: dict[str, Any]) -> None:
    errors = payload.get("errors")
    if not errors:
        return

    messages = [err.get("message", "") for err in errors]
    combined = " ".join(messages).lower()

    if "rate limit" in combined:
        raise GitHubApiError(RATE_LIMIT_ERROR, 429)
    if any(
        keyword in combined
        for keyword in ("not found", "could not resolve", "does not exist", "forbidden")
    ):
        raise GitHubApiError(PRIVATE_PROJECT_ERROR, 403)

    first_message = messages[0] if messages else "GitHub GraphQL エラーが発生しました"
    raise GitHubApiError(first_message, 502)
