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

urlpatterns = [
    path("meta/", views.meta, name="meta"),
    path("", include(router.urls)),
]
