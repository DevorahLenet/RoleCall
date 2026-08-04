"""Bridge between the design system's JSON source-of-truth files and Django.

`design-system/*.json` are the single source of truth for every enumerated
value in the app (job pipeline status, task status, task priority, task
category). Per CLAUDE.md, changing the pipeline means editing one of those
files AND running a migration — so we load them here to build the model
`choices` and the DB-level check constraints from the same data the UI reads.

Because the choices are derived from these files, editing a JSON file changes
the model field's `choices`; `makemigrations` then detects the changed
constraint and produces the migration. Edit-the-file-then-migrate, enforced.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

# backend/tracker/design_system.py -> parents[2] == repo root (RoleCall/)
_DESIGN_SYSTEM_DIR = Path(__file__).resolve().parents[2] / "design-system"


@lru_cache(maxsize=None)
def _load(filename: str) -> dict:
    """Read and parse a design-system JSON file (cached — read once per process)."""
    path = _DESIGN_SYSTEM_DIR / filename
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def _choices(filename: str, list_key: str) -> list[tuple[str, str]]:
    """Return Django `choices` [(id, label), ...] from a source-of-truth file."""
    data = _load(filename)
    return [(entry["id"], entry["label"]) for entry in data[list_key]]


def ids(filename: str, list_key: str) -> list[str]:
    """Just the stable machine ids — used to build DB check constraints."""
    return [entry["id"] for entry in _load(filename)[list_key]]


# --- Pipeline (job) status: statuses.json --------------------------------
JOB_STATUS_CHOICES = _choices("statuses.json", "statuses")
JOB_STATUS_IDS = ids("statuses.json", "statuses")

# --- Task status: task-statuses.json (no colour by design) ---------------
TASK_STATUS_CHOICES = _choices("task-statuses.json", "statuses")
TASK_STATUS_IDS = ids("task-statuses.json", "statuses")

# --- Task priority: priorities.json (ordered by rank) --------------------
_PRIORITIES = sorted(_load("priorities.json")["priorities"], key=lambda p: p["rank"])
TASK_PRIORITY_CHOICES = [(p["id"], p["label"]) for p in _PRIORITIES]
TASK_PRIORITY_IDS = [p["id"] for p in _PRIORITIES]

# --- Task category (only when no job attached): task-categories.json -----
TASK_CATEGORY_CHOICES = _choices("task-categories.json", "categories")
TASK_CATEGORY_IDS = ids("task-categories.json", "categories")

# Longest id across every enum, so char columns never truncate a valid value.
_MAX_ID_LEN = max(
    len(i)
    for group in (
        JOB_STATUS_IDS,
        TASK_STATUS_IDS,
        TASK_PRIORITY_IDS,
        TASK_CATEGORY_IDS,
    )
    for i in group
)
# Round up to a stable width so adding a slightly longer id later rarely
# forces an AlterField purely for length.
ENUM_MAX_LENGTH = max(32, _MAX_ID_LEN)
