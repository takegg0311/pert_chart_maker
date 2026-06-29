from typing import Any

from models.schemas import GhTask

TITLE_FIELD_NAME = "Title"
STATUS_FIELD_NAME = "Status"
CLOSED_STATUS_KEYWORDS = ("done", "closed", "完了", "クローズ")


def normalize_issue_nodes(nodes: list[dict[str, Any]], estimate_field: str) -> list[GhTask]:
    tasks: list[GhTask] = []
    for node in nodes:
        task = _normalize_node(node, estimate_field)
        if task is not None:
            tasks.append(task)
    return tasks


def _normalize_node(node: dict[str, Any], estimate_field: str) -> GhTask | None:
    content = node.get("content")
    if content and content.get("__typename") == "Issue":
        return GhTask(
            id=str(content["number"]),
            name=content["title"],
            duration=_extract_duration(node, estimate_field),
            predecessors=_extract_issue_numbers(content.get("blockedBy")),
            successors=_extract_issue_numbers(content.get("blocking")),
            state=content.get("state", "OPEN"),
        )

    if node.get("type") != "ISSUE":
        return None

    title = _field_value_by_name(node, TITLE_FIELD_NAME, "text")
    if not title:
        return None

    return GhTask(
        id=_fallback_task_id(node.get("id", "")),
        name=title,
        duration=_extract_duration(node, estimate_field),
        predecessors=[],
        successors=[],
        state=_infer_state_from_status(node),
    )


def _fallback_task_id(item_id: str) -> str:
    if not item_id:
        return "unknown"
    suffix = item_id.rsplit("_", 1)[-1]
    return suffix or item_id


def _infer_state_from_status(node: dict[str, Any]) -> str:
    status = _field_value_by_name(node, STATUS_FIELD_NAME, "name")
    if not status:
        return "OPEN"
    normalized = status.casefold()
    if any(keyword in normalized for keyword in CLOSED_STATUS_KEYWORDS):
        return "CLOSED"
    return "OPEN"


def _field_values(node: dict[str, Any]) -> list[dict[str, Any]]:
    field_values = node.get("fieldValues") or {}
    return field_values.get("nodes") or []


def _field_value_by_name(node: dict[str, Any], field_name: str, value_key: str) -> str | None:
    for field_value in _field_values(node):
        field = field_value.get("field") or {}
        if field.get("name") != field_name:
            continue
        value = field_value.get(value_key)
        if value is None:
            return None
        return str(value)
    return None


def _extract_duration(node: dict[str, Any], estimate_field: str) -> float:
    field_value = node.get("fieldValueByName")
    if field_value and field_value.get("__typename") == "ProjectV2ItemFieldNumberValue":
        number = field_value.get("number")
        if number is not None:
            return float(number)

    for field_value in _field_values(node):
        field = field_value.get("field") or {}
        if field.get("name") != estimate_field:
            continue
        if field_value.get("__typename") != "ProjectV2ItemFieldNumberValue":
            continue
        number = field_value.get("number")
        if number is not None:
            return float(number)

    return 0.0


def _extract_issue_numbers(connection: dict[str, Any] | None) -> list[str]:
    if not connection:
        return []
    nodes = connection.get("nodes") or []
    return [str(node["number"]) for node in nodes if node and "number" in node]
