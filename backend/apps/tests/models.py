from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

class TestGroup(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_test_groups')
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    total_marks = models.IntegerField(default=100)
    passing_marks = models.IntegerField(default=60)
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=True)  # All tests visible to all teachers by default
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.title} by {self.created_by.username}"
    
    @property
    def question_count(self):
        return self.sections.aggregate(total=models.Sum('questions__id'))['total'] or 0

class TestSection(models.Model):
    """SAT-style sections within a test"""
    test_group = models.ForeignKey(TestGroup, on_delete=models.CASCADE, related_name='sections')
    name = models.CharField(max_length=100)  # e.g., "Reading & Writing", "Math"
    description = models.TextField(blank=True)
    time_limit = models.IntegerField(help_text="Time limit in minutes for this section")
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.test_group.title} - {self.name}"

class Question(models.Model):
    section = models.ForeignKey(TestSection, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    passage_text = models.TextField(blank=True, help_text="Optional passage or context")
    marks = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order', 'id']
    
    def __str__(self):
        return f"{self.section.name} - Q{self.order}: {self.question_text[:50]}..."

class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    choice_text = models.TextField()
    choice_label = models.CharField(max_length=1, choices=[('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D')])
    is_correct = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['choice_label']
    
    def __str__(self):
        return f"{self.choice_label}. {self.choice_text}"

class StudentGroup(models.Model):
    """Groups for organizing students"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_groups')
    students = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='student_groups', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['name', 'teacher']
    
    def __str__(self):
        return f"{self.teacher.username}'s Group: {self.name}"
    
    @property
    def student_count(self):
        return self.students.count()

class TestAssignment(models.Model):
    """Assignment of tests to student groups"""
    test_group = models.ForeignKey(TestGroup, on_delete=models.CASCADE, related_name='assignments')
    student_group = models.ForeignKey(StudentGroup, on_delete=models.CASCADE, related_name='test_assignments')
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assigned_tests')
    assigned_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['test_group', 'student_group']
    
    def __str__(self):
        return f"{self.test_group.title} → {self.student_group.name}"

class StudentTestAttempt(models.Model):
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('timeout', 'Timeout'),
    ]
    
    test_group = models.ForeignKey(TestGroup, on_delete=models.CASCADE, related_name='attempts')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='test_attempts')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    current_section = models.ForeignKey(TestSection, on_delete=models.SET_NULL, null=True, blank=True)
    total_score = models.IntegerField(default=0)
    total_marks = models.IntegerField(default=0)
    percentage = models.FloatField(default=0.0)
    
    class Meta:
        unique_together = ['test_group', 'student']
    
    def __str__(self):
        return f"{self.student.username} - {self.test_group.title} ({self.status})"

class SectionAttempt(models.Model):
    """Track individual section attempts within a test"""
    test_attempt = models.ForeignKey(StudentTestAttempt, on_delete=models.CASCADE, related_name='section_attempts')
    section = models.ForeignKey(TestSection, on_delete=models.CASCADE)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    time_taken = models.IntegerField(default=0, help_text="Time taken in seconds")
    score = models.IntegerField(default=0)
    total_marks = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=StudentTestAttempt.STATUS_CHOICES, default='not_started')
    
    class Meta:
        unique_together = ['test_attempt', 'section']
    
    def __str__(self):
        return f"{self.test_attempt.student.username} - {self.section.name}"

class StudentAnswer(models.Model):
    test_attempt = models.ForeignKey(StudentTestAttempt, on_delete=models.CASCADE, related_name='answers')
    section_attempt = models.ForeignKey(SectionAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_choice = models.ForeignKey(Choice, on_delete=models.CASCADE, null=True, blank=True)
    is_correct = models.BooleanField(default=False)
    answered_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['test_attempt', 'question']
    
    def __str__(self):
        return f"{self.test_attempt.student.username} - {self.question.question_text[:30]}..."
    
    def save(self, *args, **kwargs):
        if self.selected_choice:
            self.is_correct = self.selected_choice.is_correct
        super().save(*args, **kwargs)
