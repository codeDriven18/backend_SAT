from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
import random
import string

def generate_test_code():
    """Generate a unique 6-digit test code"""
    return ''.join(random.choices(string.digits, k=6))

class TestGroup(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_test_groups')
    test_code = models.CharField(max_length=6, unique=True, default=generate_test_code)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    time_limit = models.IntegerField(help_text="Time limit in minutes", default=60)
    total_marks = models.IntegerField(default=100)
    passing_marks = models.IntegerField(default=60)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.title} - Code: {self.test_code}"
    
    @property
    def question_count(self):
        return self.questions.count()
    
    def save(self, *args, **kwargs):
        if not self.test_code:
            # Generate unique code
            while True:
                code = generate_test_code()
                if not TestGroup.objects.filter(test_code=code).exists():
                    self.test_code = code
                    break
        super().save(*args, **kwargs)

class Question(models.Model):
    test_group = models.ForeignKey(TestGroup, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    passage_text = models.TextField(blank=True, help_text="Optional passage or context for the question")
    marks = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order', 'id']
    
    def __str__(self):
        return f"{self.test_group.title} - Q{self.order}: {self.question_text[:50]}..."

class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    choice_text = models.TextField()
    choice_label = models.CharField(max_length=1, choices=[('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D')])
    is_correct = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['choice_label']
    
    def __str__(self):
        return f"{self.choice_label}. {self.choice_text}"

class StudentTestAttempt(models.Model):
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('timeout', 'Timeout'),
    ]
    
    test_group = models.ForeignKey(TestGroup, on_delete=models.CASCADE, related_name='attempts')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='test_attempts')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    score = models.IntegerField(default=0)
    total_marks = models.IntegerField(default=0)
    percentage = models.FloatField(default=0.0)
    time_taken = models.IntegerField(default=0, help_text="Time taken in minutes")
    
    class Meta:
        unique_together = ['test_group', 'student']
    
    def __str__(self):
        return f"{self.student.username} - {self.test_group.title} ({self.status})"
    
    def calculate_score(self):
        correct_answers = self.answers.filter(is_correct=True)
        self.score = sum(answer.question.marks for answer in correct_answers)
        self.total_marks = self.test_group.total_marks
        self.percentage = (self.score / self.total_marks * 100) if self.total_marks > 0 else 0
        self.save()
        return self.score

class StudentAnswer(models.Model):
    attempt = models.ForeignKey(StudentTestAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_choice = models.ForeignKey(Choice, on_delete=models.CASCADE, null=True, blank=True)
    is_correct = models.BooleanField(default=False)
    answered_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['attempt', 'question']
    
    def __str__(self):
        return f"{self.attempt.student.username} - {self.question.question_text[:30]}..."
    
    def save(self, *args, **kwargs):
        if self.selected_choice:
            self.is_correct = self.selected_choice.is_correct
        super().save(*args, **kwargs)