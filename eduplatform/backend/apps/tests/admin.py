from django.contrib import admin
from .models import TestGroup, Question, Choice, StudentTestAttempt, StudentAnswer

class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 0
    fields = ('choice_label', 'choice_text', 'is_correct')
    ordering = ('choice_label',)

class QuestionInline(admin.StackedInline):
    model = Question
    extra = 0
    fields = ('question_text', 'passage_text', 'marks', 'order')
    ordering = ('order',)

@admin.register(TestGroup)
class TestGroupAdmin(admin.ModelAdmin):
    list_display = ('title', 'test_code', 'created_by', 'difficulty', 'time_limit', 'question_count', 'is_active', 'created_at')
    list_filter = ('difficulty', 'is_active', 'created_at', 'created_by')
    search_fields = ('title', 'test_code', 'description')
    readonly_fields = ('test_code', 'created_at', 'updated_at')
    inlines = [QuestionInline]
    
    def question_count(self, obj):
        return obj.questions.count()
    question_count.short_description = 'Questions'

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('test_group', 'question_text_short', 'marks', 'order')
    list_filter = ('test_group', 'marks')
    search_fields = ('question_text', 'test_group__title')
    inlines = [ChoiceInline]
    
    def question_text_short(self, obj):
        return obj.question_text[:50] + "..." if len(obj.question_text) > 50 else obj.question_text
    question_text_short.short_description = 'Question'

@admin.register(Choice)
class ChoiceAdmin(admin.ModelAdmin):
    list_display = ('question', 'choice_label', 'choice_text_short', 'is_correct')
    list_filter = ('is_correct', 'choice_label')
    search_fields = ('choice_text', 'question__question_text')
    
    def choice_text_short(self, obj):
        return obj.choice_text[:50] + "..." if len(obj.choice_text) > 50 else obj.choice_text
    choice_text_short.short_description = 'Choice Text'

@admin.register(StudentTestAttempt)
class StudentTestAttemptAdmin(admin.ModelAdmin):
    list_display = ('student', 'test_group', 'test_code', 'status', 'score', 'percentage', 'started_at', 'completed_at')
    list_filter = ('status', 'started_at', 'test_group__difficulty')
    search_fields = ('student__username', 'test_group__title', 'test_group__test_code')
    readonly_fields = ('started_at', 'completed_at', 'percentage')
    
    def test_code(self, obj):
        return obj.test_group.test_code
    test_code.short_description = 'Test Code'

@admin.register(StudentAnswer)
class StudentAnswerAdmin(admin.ModelAdmin):
    list_display = ('attempt', 'question_short', 'selected_choice', 'is_correct', 'answered_at')
    list_filter = ('is_correct', 'answered_at')
    search_fields = ('attempt__student__username', 'question__question_text')
    
    def question_short(self, obj):
        return obj.question.question_text[:30] + "..." if len(obj.question.question_text) > 30 else obj.question.question_text
    question_short.short_description = 'Question'