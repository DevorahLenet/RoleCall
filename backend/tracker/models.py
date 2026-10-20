"""RoleCall data model.

Five entities: Job (a role in the pipeline), Task (a unit of work, optionally
attached to a job), Note and Question (each attached to exactly one of a job or a
task), and Contact (a person, linked to many jobs).

Enumerated values and their DB check constraints come from `design_system.py`,
which reads the design system's JSON source-of-truth files — never hardcode a
status/priority/category id here. Changing the pipeline = edit the JSON + migrate.

Auth is deferred (see the approved plan): no `user` FK yet. Adding auth later is
an additive migration.
"""

from __future__ import annotations

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models, transaction

from . import design_system as ds
from .passages import split_passages


class CreatedAtModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True


class Job(CreatedAtModel):
    """A role being tracked through the pipeline (statuses.json)."""

    role = models.CharField(max_length=200)
    company = models.CharField(max_length=200, default="undisclosed")
    applied_on = models.DateField(null=True, blank=True)
    posting_url = models.URLField(blank=True)
    status = models.CharField(
        max_length=ds.ENUM_MAX_LENGTH,
        choices=ds.JOB_STATUS_CHOICES,
        default="researching",
        help_text="Pipeline stage id from design-system/statuses.json.",
    )
    # How well the role fits, as a number only. It is a column of its own rather
    # than a line inside a note so jobs can be ranked by it later (stories 4-6)
    # without parsing "~8.5/10" back out of prose. The reasoning behind a score
    # belongs in the job's notes, which is where every other judgement is logged.
    fit_score = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        help_text="Fit out of 10, to one decimal place (e.g. 8.5). Null = unrated.",
    )

    class Meta:
        ordering = ["company"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(status__in=ds.JOB_STATUS_IDS),
                name="job_status_in_statuses_json",
            ),
            # The validators cover forms and DRF; this is the DB backstop, same
            # discipline as the enum constraints above.
            models.CheckConstraint(
                condition=models.Q(fit_score__isnull=True)
                | models.Q(fit_score__gte=0, fit_score__lte=10),
                name="job_fit_score_0_to_10",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.company} — {self.role}"


class Task(CreatedAtModel):
    """A unit of work. Grouped by status and sorted by priority on Today.

    A task shows EITHER a job chip (company · pipeline stage) OR, when it has no
    job, a category chip — never both. It may briefly have neither: `job` is
    SET_NULL, so deleting a job leaves its tasks job-less until reassigned.
    Completion is a boolean, not a fourth status: a done task strikes through in
    place rather than moving groups (see task-statuses.json).
    """

    job = models.ForeignKey(
        Job,
        on_delete=models.SET_NULL,
        related_name="tasks",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=300)
    category = models.CharField(
        max_length=ds.ENUM_MAX_LENGTH,
        choices=ds.TASK_CATEGORY_CHOICES,
        blank=True,
        help_text=(
            "Set only when no job is attached; must be blank when a job is. "
            "Ids from design-system/task-categories.json."
        ),
    )
    status = models.CharField(
        max_length=ds.ENUM_MAX_LENGTH,
        choices=ds.TASK_STATUS_CHOICES,
        default=ds.TASK_STATUS_DEFAULT,
        help_text="Task status id from design-system/task-statuses.json.",
    )
    is_done = models.BooleanField(default=False)
    priority = models.CharField(
        max_length=ds.ENUM_MAX_LENGTH,
        choices=ds.TASK_PRIORITY_CHOICES,
        default="med",
        help_text="Priority id from design-system/priorities.json.",
    )
    due_on = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["priority", "-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(status__in=ds.TASK_STATUS_IDS),
                name="task_status_in_task_statuses_json",
            ),
            models.CheckConstraint(
                condition=models.Q(priority__in=ds.TASK_PRIORITY_IDS),
                name="task_priority_in_priorities_json",
            ),
            models.CheckConstraint(
                condition=models.Q(category="")
                | models.Q(category__in=ds.TASK_CATEGORY_IDS),
                name="task_category_in_categories_json",
            ),
            # Never both: a task has a job OR a category, never the two together.
            # (It may have neither — see SET_NULL on `job`.)
            models.CheckConstraint(
                condition=models.Q(job__isnull=True) | models.Q(category=""),
                name="task_not_both_job_and_category",
            ),
        ]

    def __str__(self) -> str:
        return self.title


class JobOrTaskAttachment(CreatedAtModel):
    """Base for records attached to exactly one of a job or a task."""

    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name="%(class)ss",
        null=True,
        blank=True,
    )
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="%(class)ss",
        null=True,
        blank=True,
    )

    class Meta:
        abstract = True

    @classmethod
    def _exactly_one_parent_constraint(cls, name: str) -> models.CheckConstraint:
        # Exactly one of (job, task) is set.
        return models.CheckConstraint(
            condition=(
                models.Q(job__isnull=False, task__isnull=True)
                | models.Q(job__isnull=True, task__isnull=False)
            ),
            name=name,
        )


class Note(JobOrTaskAttachment):
    """A thing the user logged — a conversation, follow-up, or decision."""

    text = models.TextField()

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            JobOrTaskAttachment._exactly_one_parent_constraint(
                "note_exactly_one_parent"
            ),
        ]

    def __str__(self) -> str:
        return self.text[:60]


class Question(JobOrTaskAttachment):
    """An open question about a job or task, optionally answered/resolved."""

    text = models.TextField()
    answer = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            JobOrTaskAttachment._exactly_one_parent_constraint(
                "question_exactly_one_parent"
            ),
        ]

    def __str__(self) -> str:
        return self.text[:60]


class Contact(models.Model):
    """A person, linked to any number of jobs (replaces the job_contact join)."""

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    links = models.JSONField(default=list, blank=True)
    jobs = models.ManyToManyField(Job, related_name="contacts", blank=True)

    class Meta:
        ordering = ["first_name", "last_name"]

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()


class WritingPiece(CreatedAtModel):
    """A saved piece of writing — a resume, cover letter, blurb or impact
    statement (writing-types.json).

    `job` is nullable and SET_NULL, matching Task: tailored resumes and
    job-specific blurbs have a job, base resumes and impact statements do not,
    and deleting a job must not destroy the writing done for it. Company
    filtering falls out of the job relation rather than needing its own column.

    `derived_from` records lineage — a tailored resume is a fork of a base one,
    which is what makes "which existing piece is closest to what I need?"
    answerable.

    `body` is markdown, and that is load-bearing: passages are split out of it
    on every save, so a piece pasted in as one unstructured blob produces one
    useless passage and silently degrades topic search.
    """

    job = models.ForeignKey(
        Job,
        on_delete=models.SET_NULL,
        related_name="writing_pieces",
        null=True,
        blank=True,
    )
    type = models.CharField(
        max_length=ds.ENUM_MAX_LENGTH,
        choices=ds.WRITING_TYPE_CHOICES,
        help_text="Writing type id from design-system/writing-types.json.",
    )
    title = models.CharField(max_length=200)
    body = models.TextField(help_text="Markdown. Passages are split out of it on save.")
    derived_from = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        related_name="forks",
        null=True,
        blank=True,
        help_text="The piece this one was forked from, if any.",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(type__in=ds.WRITING_TYPE_IDS),
                name="writingpiece_type_in_writing_types_json",
            ),
        ]

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        """Save, then re-derive the passages. The override (the only one in this
        app) is deliberate: chunking has to happen for the admin and the seed
        command too, so it belongs on the model rather than in a serializer."""
        with transaction.atomic():
            super().save(*args, **kwargs)
            self.sync_passages()

    def sync_passages(self) -> None:
        """Rebuild this piece's passages from `body`, KEEPING the use counts of
        passages whose text is unchanged.

        Deleting and recreating the lot on every save would be simpler and
        wrong: `use_count` is what makes "most used" mean anything, and it is
        the app's whole substitute for asking the user to star their best work.
        A reworded passage does start again from zero — matching text is the
        only honest way to know it is still the same line.
        """
        wanted = split_passages(self.body)
        existing = {p.text: p for p in self.passages.all()}

        keep_ids: list[int] = []
        for position, text in enumerate(wanted):
            passage = existing.get(text)
            if passage is not None and passage.id not in keep_ids:
                if passage.position != position:
                    passage.position = position
                    passage.save(update_fields=["position"])
                keep_ids.append(passage.id)
            else:
                keep_ids.append(
                    WritingPassage.objects.create(
                        piece=self, text=text, position=position
                    ).id
                )

        self.passages.exclude(id__in=keep_ids).delete()


class WritingPassage(models.Model):
    """One reusable chunk of a piece — a bullet or a paragraph.

    Derived from the piece's body, never authored (see passages.py). A plain
    Model rather than CreatedAtModel: a passage has no life of its own to date,
    it belongs to its piece and dies with it (CASCADE).

    `use_count`/`last_used_at` are stamped every time the passage is copied,
    which is what lets "best writing" be computed rather than curated.
    """

    piece = models.ForeignKey(
        WritingPiece, on_delete=models.CASCADE, related_name="passages"
    )
    text = models.TextField()
    position = models.IntegerField()
    use_count = models.IntegerField(default=0)
    last_used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["position"]

    def __str__(self) -> str:
        return self.text[:60]
