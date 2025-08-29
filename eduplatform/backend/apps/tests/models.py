from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

class Test(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_tests')
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    time_limit = models.IntegerField(help_text="Time limit in minutes", default=60)
    total_marks = models.IntegerField(default=100)
    passing_marks = models.IntegerField(default=60)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title
    
    @property
    def question_count(self):
        return self.questions.count()

class Question(models.Model):
    QUESTION_TYPES = [
        ('multiple_choice', 'Multiple Choice'),
        ('true_false', 'True/False'),
        ('short_answer', 'Short Answer'),
    ]
    
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default='multiple_choice')
    marks = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order', 'id']
    
    def __str__(self):
        return f"{self.test.title} - Q{self.order}: {self.question_text[:50]}..."

class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    choice_text = models.CharField(max_length=200)
    is_correct = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.question.question_text[:30]}... - {self.choice_text}"

class TestAssignment(models.Model):
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='assignments')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assigned_tests')
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assigned_by_me')
    assigned_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ['test', 'assigned_to']
    
    def __str__(self):
        return f"{self.test.title} - Assigned to {self.assigned_to.username}"

class TestAttempt(models.Model):
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('timeout', 'Timeout'),
    ]
    
    assignment = models.ForeignKey(TestAssignment, on_delete=models.CASCADE, related_name='attempts')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='test_attempts')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    score = models.IntegerField(default=0)
    total_marks = models.IntegerField(default=0)
    percentage = models.FloatField(default=0.0)
    time_taken = models.IntegerField(default=0, help_text="Time taken in minutes")
    
    def __str__(self):
        return f"{self.student.username} - {self.assignment.test.title} ({self.status})"
    
    def calculate_score(self):
        correct_answers = self.answers.filter(is_correct=True)
        self.score = sum(answer.question.marks for answer in correct_answers)
        self.total_marks = self.assignment.test.total_marks
        self.percentage = (self.score / self.total_marks * 100) if self.total_marks > 0 else 0
        self.save()
        return self.score

class Answer(models.Model):
    attempt = models.ForeignKey(TestAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_choice = models.ForeignKey(Choice, on_delete=models.CASCADE, null=True, blank=True)
    text_answer = models.TextField(blank=True)  # For short answer questions
    is_correct = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ['attempt', 'question']
    
    def __str__(self):
        return f"{self.attempt.student.username} - {self.question.question_text[:30]}..."