"""Load the Writing Library from `writing.seed.local.json` at the repo root.

Separate from `seed_local` on purpose, and narrower: this wipes and reloads
ONLY the writing tables. Jobs, tasks, notes, questions and contacts are never
touched, so seeding your writing cannot cost you your pipeline.

    python manage.py seed_writing

Passages are NOT in the file. They are derived from each piece's `body` by the
same splitter the model uses on save, so a seeded piece chunks identically to
one authored in the app — otherwise seeded writing would search differently
from written writing.

File shape (see writing.seed.local.example.json):

    {"pieces": [
      {"key": "base-pm-resume", "type": "resume", "title": "Base PM resume",
       "body": "…markdown…", "job": null, "derived_from": null,
       "passage_use_count": 0},
      {"key": "empeon-ops", "type": "resume", "title": "Empeon — ops resume",
       "body": "…", "job": {"company": "Empeon", "role": "Product Operations Manager"},
       "derived_from": "base-pm-resume", "passage_use_count": 3}
    ]}

`key` and `derived_from` are natural keys that exist only in the file; they are
resolved to real ids and dropped, the same scheme `seed.local.json` uses.
"""

from __future__ import annotations

import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from tracker.models import Job, WritingPassage, WritingPiece

# backend/ -> parent is the repo root, where the seed files live.
SEED_PATH = settings.BASE_DIR.parent / "writing.seed.local.json"


# `manage.py seed_writing` — reset the writing tables from the seed file.
class Command(BaseCommand):
    help = "Reset the Writing Library from writing.seed.local.json (writing tables only)."

    def handle(self, *args, **options):
        path: Path = SEED_PATH
        if not path.exists():
            raise CommandError(
                f"Seed file not found: {path}\n"
                "Copy writing.seed.local.example.json to writing.seed.local.json "
                "and put your real writing in it (it is gitignored)."
            )

        data = json.loads(path.read_text(encoding="utf-8"))

        # Wipe children before parents, and nothing outside writing.
        WritingPassage.objects.all().delete()
        WritingPiece.objects.all().delete()

        # --- Pieces: build a key -> WritingPiece map (the `key` is not a column) ---
        pieces_by_key: dict[str, WritingPiece] = {}
        unmatched: list[str] = []

        for row in data.get("pieces", []):
            job = self._resolve_job(row.get("job"), row["title"], unmatched)
            piece = WritingPiece.objects.create(
                type=row["type"],
                title=row["title"],
                body=row["body"],
                job=job,
            )
            key = row.get("key")
            if key:
                pieces_by_key[key] = piece

            # Saving already derived the passages; seed their use count so the
            # "most used" sort has something to rank on from the first load.
            use_count = row.get("passage_use_count", 0)
            if use_count:
                piece.passages.update(use_count=use_count)

        # --- Lineage: a second pass, since a fork can precede its parent ---
        for row in data.get("pieces", []):
            parent_key = row.get("derived_from")
            key = row.get("key")
            if not parent_key or not key or key not in pieces_by_key:
                continue
            parent = pieces_by_key.get(parent_key)
            if parent is None:
                self.stdout.write(
                    self.style.WARNING(
                        f'  {row["title"]!r}: derived_from "{parent_key}" matches no key'
                    )
                )
                continue
            piece = pieces_by_key[key]
            # update() rather than save(): the body has not changed, and there
            # is no reason to re-derive passages (and reset nothing) for a
            # lineage link.
            WritingPiece.objects.filter(pk=piece.pk).update(derived_from=parent)

        for warning in unmatched:
            self.stdout.write(self.style.WARNING(warning))

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {WritingPiece.objects.count()} pieces, "
                f"{WritingPassage.objects.count()} passages "
                f"({len(unmatched)} without a job)."
            )
        )

    # Match a job by company AND role together: company alone is ambiguous in
    # this data (two Base44 roles, two Rounds, two Har Hotzvim). A miss leaves
    # the piece unattached and warns — refusing to load the whole library
    # because one role was renamed would be worse than saying which piece lost
    # its link.
    def _resolve_job(self, spec, title: str, unmatched: list[str]) -> Job | None:
        if not spec:
            return None
        company = spec.get("company")
        role = spec.get("role")
        job = Job.objects.filter(company=company, role=role).first()
        if job is None:
            unmatched.append(
                f"  {title!r}: no job matching {company!r} / {role!r} — left unattached"
            )
        return job
