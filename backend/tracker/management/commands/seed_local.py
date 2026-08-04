"""Load the database from `seed.local.json` at the repo root.

`seed.local.json` is the user's real (gitignored) job-search data. It uses a
`key`/`job_key` natural-key scheme that exists only in the file: jobs carry a
`key`; tasks/notes/questions/contacts reference it. This command resolves those
keys to real primary keys and drops them.

    python manage.py seed_local

Idempotent: wipes tasks/questions/notes/contacts/jobs first, then reloads.
Never run against production data.
"""

from __future__ import annotations

import json
from datetime import datetime, time
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.utils.dateparse import parse_date

from tracker.models import Contact, Job, Note, Question, Task

# backend/ -> parent is the repo root, where seed.local.json lives.
SEED_PATH = settings.BASE_DIR.parent / "seed.local.json"


# Parse an optional ISO date string; empty/None stays None.
def _date(value):
    return parse_date(value) if value else None


def _datetime(value):
    """Seed resolved_at values are plain dates; store as aware midnight."""
    if not value:
        return None
    naive = datetime.combine(parse_date(value), time.min)
    return timezone.make_aware(naive) if settings.USE_TZ else naive


# `manage.py seed_local` — wipe every table and reload from seed.local.json.
class Command(BaseCommand):
    help = "Reset the database from seed.local.json (real, gitignored data)."

    # Read the seed file, clear existing rows, then recreate jobs and their
    # dependents, resolving the file's natural keys to real foreign keys.
    def handle(self, *args, **options):
        path: Path = SEED_PATH
        if not path.exists():
            raise CommandError(f"Seed file not found: {path}")

        data = json.loads(path.read_text(encoding="utf-8"))

        # Wipe children before parents.
        Task.objects.all().delete()
        Question.objects.all().delete()
        Note.objects.all().delete()
        Contact.objects.all().delete()
        Job.objects.all().delete()

        # --- Jobs: build a key -> Job map (the `key` is not a DB column) ---
        jobs_by_key: dict[str, Job] = {}
        for row in data.get("jobs", []):
            key = row["key"]
            jobs_by_key[key] = Job.objects.create(
                role=row["role"],
                company=row.get("company", "undisclosed"),
                status=row["status"],
                posting_url=row.get("posting_url", ""),
                applied_on=_date(row.get("applied_on")),
            )

        # Look up the Job a child row points at via its `job_key` (None if unset).
        def resolve_job(row):
            key = row.get("job_key")
            return jobs_by_key[key] if key else None

        # --- Notes (attached to a job here; task attachment supported too) --
        for row in data.get("notes", []):
            Note.objects.create(
                job=resolve_job(row),
                text=row["text"],
            )

        # --- Questions -----------------------------------------------------
        for row in data.get("questions", []):
            Question.objects.create(
                job=resolve_job(row),
                text=row["text"],
                answer=row.get("answer", ""),
                resolved_at=_datetime(row.get("resolved_at")),
            )

        # --- Tasks (job XOR category) --------------------------------------
        for row in data.get("tasks", []):
            Task.objects.create(
                job=resolve_job(row),
                title=row["title"],
                category=row.get("category", ""),
                status=row["status"],
                priority=row["priority"],
                is_done=row.get("is_done", False),
                due_on=_date(row.get("due_on")),
            )

        # --- Contacts (optional; empty in the current seed) ----------------
        for row in data.get("contacts", []):
            contact = Contact.objects.create(
                first_name=row["first_name"],
                last_name=row.get("last_name", ""),
                email=row.get("email", ""),
                phone=row.get("phone", ""),
                description=row.get("description", ""),
                links=row.get("links", []),
            )
            job_keys = row.get("job_keys", [])
            if job_keys:
                contact.jobs.set([jobs_by_key[k] for k in job_keys])

        self.stdout.write(
            self.style.SUCCESS(
                "Seeded "
                f"{Job.objects.count()} jobs, "
                f"{Task.objects.count()} tasks, "
                f"{Note.objects.count()} notes, "
                f"{Question.objects.count()} questions, "
                f"{Contact.objects.count()} contacts."
            )
        )
