from django.contrib import admin
from .models import (
    TestGroup, Question, Choice,
    StudentGroup, TestAssignment,
    StudentTestAttempt, StudentAnswer
)

class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 4
    max_num = 4

class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    fields = ('question_text', 'marks', 'order')

@admin.register(TestGroup)
class TestGroupAdmin(admin.ModelAdmin):
    list_display = ['title', 'created_by', 'difficulty', 'total_marks', 'is_active', 'created_at', 'is_preview']
    list_filter = ['difficulty', 'is_active', 'created_by', 'is_preview']
    search_fields = ['title', 'description']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [QuestionInline]

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['id', 'question_text', 'test_group', 'image']
    list_filter = ['test_group']


@admin.register(StudentGroup)
class StudentGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'teacher', 'student_count', 'created_at']
    filter_horizontal = ['students']

@admin.register(TestAssignment)
class TestAssignmentAdmin(admin.ModelAdmin):
    list_display = ['test_group', 'student_group', 'assigned_by', 'is_active', 'assigned_at']
    list_filter = ['is_active', 'assigned_by']

@admin.register(StudentTestAttempt)
class StudentTestAttemptAdmin(admin.ModelAdmin):
    list_display = ['student', 'test_group', 'status', 'total_score', 'percentage', 'started_at']
    list_filter = ['status', 'test_group']

@admin.register(StudentAnswer)
class StudentAnswerAdmin(admin.ModelAdmin):
    list_display = ['test_attempt', 'question', 'selected_choice', 'is_correct']
    list_filter = ['is_correct']
