from django.db import models
from django.conf import settings

class DashboardStats(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    total_tests = models.IntegerField(default=0)
    completed_tests = models.IntegerField(default=0)
    average_score = models.FloatField(default=0.0)
    highest_score = models.FloatField(default=0.0)
    total_students = models.IntegerField(default=0)  # For teachers
    active_assignments = models.IntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Dashboard Stats"
    
    def __str__(self):
        return f"Stats for {self.user.username}"

class ActivityLog(models.Model):
    ACTIVITY_TYPES = [
        ('test_created', 'Test Created'),
        ('test_assigned', 'Test Assigned'),
        ('test_completed', 'Test Completed'),
        ('user_registered', 'User Registered'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user.username} - {self.activity_type} - {self.timestamp}"