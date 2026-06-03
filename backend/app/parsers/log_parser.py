import re


_DATE_RE = re.compile(r"\b\d{4}-\d{2}-\d{2}\b")
_TIME_RE = re.compile(r"\b\d{2}:\d{2}\b")
_LEVEL_RE = re.compile(r"\b(INFO|WARN|ERROR|DEBUG)\b")
_CATEGORY_RE = re.compile(r"\]\s+([a-zA-Z0-9.]+)\s+:")


def parse_log_text(text: str) -> list[dict]:
    lines = [line for line in text.splitlines() if line.strip()]
    parsed: list[dict] = []
    for index, line in enumerate(lines):
        parsed.append(_parse_line(line, index))
    return parsed


def _parse_line(line: str, index: int) -> dict:
    date_match = _DATE_RE.search(line)
    time_match = _TIME_RE.search(line)
    level_match = _LEVEL_RE.search(line)
    category_match = _CATEGORY_RE.search(line)

    message_part = line
    if " : " in line:
        message_part = line.split(" : ", 1)[1]

    category = "General"
    if category_match:
        category = category_match.group(1).split(".")[-1] or "General"

    return {
        "id": index + 1,
        "date": date_match.group(0) if date_match else "",
        "time": time_match.group(0) if time_match else "00:00",
        "level": level_match.group(1) if level_match else "INFO",
        "category": category,
        "message": message_part,
    }

