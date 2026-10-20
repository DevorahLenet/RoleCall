"""Django admin registrations — a quick internal console over the data model."""

from django.contrib import admin

from .models import Contact, Job, Note, Question, Task, WritingPassage, WritingPiece


# Jobs: browse the pipeline, filter by stage, search by company/role.
@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ("company", "role", "status", "applied_on")
    list_filter = ("status",)
    search_fields = ("company", "role")


# Tasks: surface status/priority/done and the job-or-category attachment.
@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "priority", "is_done", "job", "category")
    list_filter = ("status", "priority", "is_done")
    search_fields = ("title",)


# Notes: show the parent (job or task) and when it was logged.
@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ("__str__", "job", "task", "created_at")
    search_fields = ("text",)


# Questions: like notes, plus whether/when they were resolved.
@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("__str__", "job", "task", "resolved_at", "created_at")
    list_filter = ("resolved_at",)
    search_fields = ("text", "answer")


# Contacts: people, with the many-to-many job links as a dual-list picker.
@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("first_name", "last_name", "email", "phone")
    search_fields = ("first_name", "last_name", "email")
    filter_horizontal = ("jobs",)


# Writing pieces: the only place a piece can be authored until the job page
# grows a writing surface. Saving one re-derives its passages.
@admin.register(WritingPiece)
class WritingPieceAdmin(admin.ModelAdmin):
    list_display = ("title", "type", "job", "updated_at")
    list_filter = ("type",)
    search_fields = ("title", "body")


# Passages: derived from a piece's body, so this is a read-through rather than
# an editing surface.
@admin.register(WritingPassage)
class WritingPassageAdmin(admin.ModelAdmin):
    list_display = ("__str__", "piece", "position", "use_count", "last_used_at")
    list_filter = ("piece__type",)
    search_fields = ("text",)
