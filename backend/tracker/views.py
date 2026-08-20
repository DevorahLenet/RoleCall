"""API views.

Read/write endpoints for every entity, plus a small `meta` endpoint echoing the
design-system enum ids. Auth is deferred, so these are open for the single-user
MVP; they gain a per-user filter when auth lands.
"""

from __future__ import annotations

from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from . import design_system as ds
from .models import Contact, Job, Note, Question, Task
from .serializers import (
    ContactSerializer,
    JobDetailSerializer,
    JobSerializer,
    NoteSerializer,
    QuestionSerializer,
    TaskSerializer,
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


@api_view(["GET"])
def meta(_request):
    """The enum ids the API accepts, straight from the design-system files."""
    return Response(
        {
            "job_status": ds.JOB_STATUS_IDS,
            "task_status": ds.TASK_STATUS_IDS,
            "task_priority": ds.TASK_PRIORITY_IDS,
            "task_category": ds.TASK_CATEGORY_IDS,
        }
    )
