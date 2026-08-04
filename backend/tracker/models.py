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

from django.db import models

from . import design_system as ds


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

    class Meta:
        ordering = ["company"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(status__in=ds.JOB_STATUS_IDS),
                name="job_status_in_statuses_json",
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
        default="todo",
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
