"""API views.

Read/write endpoints for every entity, plus a small `meta` endpoint echoing the
design-system enum ids. Auth is deferred, so these are open for the single-user
MVP; they gain a per-user filter when auth lands.
"""

from __future__ import annotations

from django.db.models import Sum, Value
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from . import design_system as ds
from .models import Contact, Job, Note, Question, Task, WritingPassage, WritingPiece
from .search import search_passages
from .serializers import (
    ContactSerializer,
    JobDetailSerializer,
    JobSerializer,
    NoteSerializer,
    QuestionSerializer,
    TaskSerializer,
    WritingPassageSerializer,
    WritingPieceDetailSerializer,
    WritingPieceSerializer,
)


class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all()
    serializer_class = JobSerializer

    # The job page reads and writes the detail payload (contacts, notes,
    # questions, long-form fields); the board's list stays slim so a JD summary
    # never rides along with every card.
    DETAIL_ACTIONS = ("retrieve", "update", "partial_update")

    def get_serializer_class(self):
        if self.action in self.DETAIL_ACTIONS:
            return JobDetailSerializer
        return JobSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action in self.DETAIL_ACTIONS:
            qs = qs.prefetch_related("contacts", "notes", "questions")
        return qs


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.select_related("job").all()
    serializer_class = TaskSerializer


class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer


class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer


class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer


class WritingPieceViewSet(viewsets.ReadOnlyModelViewSet):
    """The Writing Library, read-only.

    Deliberately not a ModelViewSet: nothing creates or edits a piece in this
    pass. Writing is authored on a job page (still to build) so that the library
    stays a view over the data rather than a second place to remember to
    populate — and an API that cannot write says so plainly in the meantime.
    """

    queryset = WritingPiece.objects.select_related("job").all()
    serializer_class = WritingPieceSerializer

    def get_serializer_class(self):
        # The piece page reads the body, passages and lineage; the index list
        # stays slim so a whole resume never rides along with a row.
        if self.action == "retrieve":
            return WritingPieceDetailSerializer
        return WritingPieceSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == "retrieve":
            return qs.select_related("derived_from").prefetch_related(
                "passages", "forks"
            )

        # The index's filters, applied here rather than in the client so that
        # browsing and searching narrow by exactly the same rules.
        params = self.request.query_params
        type_id = params.get("type")
        company = params.get("company")
        if type_id:
            qs = qs.filter(type=type_id)
        if company:
            qs = qs.filter(job__company=company)
        # "Most used" ranks a piece by how much its passages get reached for.
        if params.get("sort") == "used":
            qs = qs.order_by(Coalesce(Sum("passages__use_count"), Value(0)).desc(), "-updated_at")
        return qs


@api_view(["GET"])
def writing_search(request):
    """Passages matching `q`, with the index's filters applied.

    A separate endpoint from the piece list because the result is a different
    unit: filters narrow documents, search returns lines.
    """
    return Response(
        search_passages(
            request.query_params.get("q", ""),
            type_id=request.query_params.get("type") or None,
            company=request.query_params.get("company") or None,
            sort=request.query_params.get("sort", "relevance"),
        )
    )


@api_view(["POST"])
def passage_used(_request, pk: int):
    """Record that a passage was copied.

    This is what makes "best writing" computed rather than curated: the lines
    actually reached for float up on their own, with no starring to maintain.
    """
    passage = get_object_or_404(WritingPassage, pk=pk)
    passage.use_count += 1
    passage.last_used_at = timezone.now()
    passage.save(update_fields=["use_count", "last_used_at"])
    return Response(WritingPassageSerializer(passage).data)


@api_view(["GET"])
def meta(_request):
    """The enum ids the API accepts, straight from the design-system files."""
    return Response(
        {
            "job_status": ds.JOB_STATUS_IDS,
            "task_status": ds.TASK_STATUS_IDS,
            "task_priority": ds.TASK_PRIORITY_IDS,
            "task_category": ds.TASK_CATEGORY_IDS,
            "writing_type": ds.WRITING_TYPE_IDS,
        }
    )
