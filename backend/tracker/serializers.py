"""API serializers.

The frontend resolves labels/colours for statuses, priorities and categories
from the design-system JSON itself, so the API sends stable ids only plus the
minimal job context a task row needs for its chip — never presentation values.
"""

from __future__ import annotations

from rest_framework import serializers

from .models import Contact, Job, Note, Question, Task, WritingPassage, WritingPiece


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

    # A blank company means "undisclosed". The model's default only fires on
    # create, so it is applied here instead: that way the New application form
    # and the edit dialog can both send an empty field and mean the same thing,
    # without the frontend having to know what the default string is.
    company = serializers.CharField(required=False, allow_blank=True, max_length=200)

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

    def validate_company(self, value: str) -> str:
        return value.strip() or Job._meta.get_field("company").default


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


class JobDetailSerializer(JobSerializer):
    """Detail payload for the job page: the slim job, its long-form fields, and
    everything hanging off it. Contacts, notes and questions ride along so the
    page loads in one request; all three are read-only here and are written
    through their own endpoints (contacts from the Contact side, via `Contact.jobs`).

    Defined last in this file because it embeds the serializers below it."""

    contacts = ContactSerializer(many=True, read_only=True)
    notes = NoteSerializer(many=True, read_only=True)
    questions = QuestionSerializer(many=True, read_only=True)
    # DRF renders a DecimalField as a string by default. The score is a number
    # everywhere it's used — a stepped input, and a sort key later — so it goes
    # over the wire as one.
    fit_score = serializers.DecimalField(
        max_digits=3,
        decimal_places=1,
        coerce_to_string=False,
        allow_null=True,
        required=False,
        # Declaring the field by hand drops the model's validators, so the range
        # is restated here. Without it an out-of-range score reaches the DB check
        # constraint and surfaces as a 500 instead of a 400.
        min_value=0,
        max_value=10,
    )

    class Meta(JobSerializer.Meta):
        fields = [
            *JobSerializer.Meta.fields,
            "fit_score",
            "contacts",
            "notes",
            "questions",
        ]


class WritingPassageSerializer(serializers.ModelSerializer):
    """One reusable chunk. Read-only everywhere: passages are derived from the
    piece's body, never edited on their own."""

    class Meta:
        model = WritingPassage
        fields = ["id", "text", "position", "use_count", "last_used_at"]
        read_only_fields = fields


class WritingPieceSerializer(serializers.ModelSerializer):
    """Slim payload for the library index — enough for a list row, without
    dragging a whole resume's body along with every result."""

    company = serializers.CharField(source="job.company", read_only=True, default=None)
    preview = serializers.SerializerMethodField()
    preview_passage = serializers.SerializerMethodField()

    class Meta:
        model = WritingPiece
        fields = [
            "id",
            "title",
            "type",
            "job",
            "company",
            "preview",
            "preview_passage",
            "created_at",
            "updated_at",
        ]

    def _first_passage(self, piece: WritingPiece):
        """The piece's opening passage, or None.

        `.all()[:1]` rather than `.first()` so a prefetched `passages` cache is
        reused; `.first()` would issue a query per row.
        """
        first = piece.passages.all()[:1]
        return first[0] if first else None

    def get_preview(self, piece: WritingPiece) -> str:
        """The text a library tile leads with.

        A tile shows CONTENT first and its title second, so a row needs a line
        of the writing itself. One passage rather than the body keeps the index
        payload slim — the whole point of this serializer — and it is the same
        chunk the piece panel and search both treat as a unit.
        """
        passage = self._first_passage(piece)
        return passage.text if passage else ""

    def get_preview_passage(self, piece: WritingPiece) -> int | None:
        """Which passage `preview` came from, so copying it from a tile can be
        credited like any other copy. Without this, the one copy affordance on
        the browse list would be the only one that never counts — and "most
        used" is computed from those counts, not curated."""
        passage = self._first_passage(piece)
        return passage.id if passage else None


class WritingPieceLineageSerializer(serializers.ModelSerializer):
    """Just enough of a piece to name it in a lineage line."""

    class Meta:
        model = WritingPiece
        fields = ["id", "title", "type"]


class WritingPieceDetailSerializer(WritingPieceSerializer):
    """Detail payload for the piece page: the slim piece plus its body, its
    passages, and its lineage in both directions.

    Defined last because it embeds the serializers above it."""

    passages = WritingPassageSerializer(many=True, read_only=True)
    derived_from = WritingPieceLineageSerializer(read_only=True)
    forks = WritingPieceLineageSerializer(many=True, read_only=True)
    role = serializers.CharField(source="job.role", read_only=True, default=None)

    class Meta(WritingPieceSerializer.Meta):
        fields = [
            *WritingPieceSerializer.Meta.fields,
            "role",
            "body",
            "passages",
            "derived_from",
            "forks",
        ]
