"""API serializers.

The frontend resolves labels/colours for statuses, priorities and categories
from the design-system JSON itself, so the API sends stable ids only plus the
minimal job context a task row needs for its chip — never presentation values.
"""

from __future__ import annotations

from rest_framework import serializers

from .models import Contact, Job, Note, Question, Task


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "description",
            "links",
            "jobs",
        ]


class JobSerializer(serializers.ModelSerializer):
    """Slim payload for the Jobs list/board — the job's own fields only."""

    class Meta:
        model = Job
        fields = [
            "id",
            "role",
            "company",
            "status",
            "posting_url",
            "applied_on",
            "created_at",
        ]


class JobDetailSerializer(JobSerializer):
    """Detail payload — the slim job plus its embedded contacts (read-only;
    the link is written from the Contact side via `Contact.jobs`)."""

    contacts = ContactSerializer(many=True, read_only=True)

    class Meta(JobSerializer.Meta):
        fields = [*JobSerializer.Meta.fields, "contacts"]


class TaskSerializer(serializers.ModelSerializer):
    # Read-only job context for the row's chip (company · pipeline stage).
    job_company = serializers.CharField(source="job.company", read_only=True)
    job_status = serializers.CharField(source="job.status", read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "status",
            "priority",
            "is_done",
            "due_on",
            "job",
            "job_company",
            "job_status",
            "category",
            "created_at",
        ]

    def validate(self, attrs):
        """Enforce 'never both' at the API layer with a clear message (the DB
        check constraint is the backstop). Neither is allowed — a job can be
        deleted out from under a task (SET_NULL)."""
        job = attrs.get("job", getattr(self.instance, "job", None))
        category = attrs.get("category", getattr(self.instance, "category", ""))
        if job is not None and category:
            raise serializers.ValidationError(
                "A task attached to a job must not also have a category."
            )
        return attrs


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ["id", "job", "task", "text", "created_at"]

    def validate(self, attrs):
        _validate_exactly_one_parent(self, attrs)
        return attrs


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = [
            "id",
            "job",
            "task",
            "text",
            "answer",
            "resolved_at",
            "created_at",
        ]

    def validate(self, attrs):
        _validate_exactly_one_parent(self, attrs)
        return attrs


def _validate_exactly_one_parent(serializer, attrs):
    """Notes and questions attach to exactly one of a job or a task."""
    job = attrs.get("job", getattr(serializer.instance, "job", None))
    task = attrs.get("task", getattr(serializer.instance, "task", None))
    if bool(job) == bool(task):
        raise serializers.ValidationError(
            "Attach to exactly one of a job or a task."
        )
