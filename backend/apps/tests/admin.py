from django.contrib import admin
from .models import TestGroup, TestSection, Question, Choice, StudentGroup, TestAssignment, StudentTestAttempt, SectionAttempt, StudentAnswer

class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 4
    max_num = 4

class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    fields = ('question_text', 'marks', 'order')

class TestSectionInline(admin.StackedInline):
    model = TestSection
    extra = 1
    fields = ('name', 'time_limit', 'order')

@admin.register(TestGroup)
class TestGroupAdmin(admin.ModelAdmin):
    list_display = ['title', 'created_by', 'difficulty', 'total_marks', 'is_active', 'created_at']
    list_filter = ['difficulty', 'is_active', 'created_by']
    search_fields = ['title', 'description']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [TestSectionInline]

@admin.register(TestSection)
class TestSectionAdmin(admin.ModelAdmin):
    list_display = ['name', 'test_group', 'time_limit', 'order']
    list_filter = ['test_group']
    inlines = [QuestionInline]

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['question_text', 'section', 'marks', 'order']
    list_filter = ['section__test_group']
    inlines = [ChoiceInline]

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

@admin.register(SectionAttempt)
class SectionAttemptAdmin(admin.ModelAdmin):
    list_display = ['test_attempt', 'section', 'status', 'score', 'time_taken']

@admin.register(StudentAnswer)
class StudentAnswerAdmin(admin.ModelAdmin):
    list_display = ['test_attempt', 'question', 'selected_choice', 'is_correct']
    list_filter = ['is_correct']