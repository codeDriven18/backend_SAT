from django.contrib import admin
from .models import Test, Question, Choice, TestAssignment, TestAttempt, Answer

class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 4

class QuestionInline(admin.StackedInline):
    model = Question
    extra = 0
    inlines = [ChoiceInline]

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('test', 'question_text', 'question_type', 'marks', 'order')
    list_filter = ('question_type', 'test')
    search_fields = ('question_text',)
    inlines = [ChoiceInline]

@admin.register(Test)
class TestAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_by', 'difficulty', 'total_marks', 'is_active', 'created_at')
    list_filter = ('difficulty', 'is_active', 'created_at')
    search_fields = ('title', 'description')
    inlines = [QuestionInline]

@admin.register(TestAssignment)
class TestAssignmentAdmin(admin.ModelAdmin):
    list_display = ('test', 'assigned_to', 'assigned_by', 'assigned_at', 'due_date', 'is_completed')
    list_filter = ('is_completed', 'assigned_at', 'due_date')
    search_fields = ('test__title', 'assigned_to__username', 'assigned_by__username')

@admin.register(TestAttempt)
class TestAttemptAdmin(admin.ModelAdmin):
    list_display = ('student', 'assignment', 'status', 'score', 'percentage', 'started_at', 'completed_at')
    list_filter = ('status', 'started_at', 'completed_at')
    search_fields = ('student__username', 'assignment__test__title')

@admin.register(Choice)
class ChoiceAdmin(admin.ModelAdmin):
    list_display = ('question', 'choice_text', 'is_correct')
    list_filter = ('is_correct',)

@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ('attempt', 'question', 'selected_choice', 'is_correct')
    list_filter = ('is_correct',)