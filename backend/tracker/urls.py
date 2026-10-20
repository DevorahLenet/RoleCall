"""tracker API routes, mounted under /api/ by the project urlconf."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("jobs", views.JobViewSet)
router.register("tasks", views.TaskViewSet)
router.register("notes", views.NoteViewSet)
router.register("questions", views.QuestionViewSet)
router.register("contacts", views.ContactViewSet)
router.register("writing", views.WritingPieceViewSet)

urlpatterns = [
    path("meta/", views.meta, name="meta"),
    # Both sit above the router: its API-root pattern is greedy about the
    # root, and "writing/search/" must not be read as a piece whose id is
    # "search".
    path("writing/search/", views.writing_search, name="writing-search"),
    path(
        "writing/passages/<int:pk>/used/",
        views.passage_used,
        name="writing-passage-used",
    ),
    path("", include(router.urls)),
]
