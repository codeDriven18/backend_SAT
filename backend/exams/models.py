# from django.db import models

# from django.contrib.auth.models import User 
# from datetime import timedelta
# from django.utils import timezone

# class Test(models.Model):
#     title = models.CharField(max_length=200)
#     created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tests")
#     duration_minutes = models.IntegerField(default=30)  

# class Assignment(models.Model):
#     student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="assignments")
#     test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name="assignments")
#     status = models.CharField(
#         max_length=20,
#         choices=[("not_started", "Not Started"), ("in_progress", "In Progress"), ("completed", "Completed")],
#         default="not_started"
#     )
#     start_time = models.DateTimeField(null=True, blank=True)
#     end_time = models.DateTimeField(null=True, blank=True)

#     def start_exam(self):
#         self.start_time = timezone.now()
#         self.end_time = self.start_time + timedelta(minutes=self.test.duration_minutes)
#         self.status = "in_progress"
#         self.save()

from django.db import models
from django.conf import settings
from datetime import timedelta
from django.utils import timezone


class Test(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tests"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Question(models.Model):
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name="questions")
    text = models.TextField()

    option1 = models.CharField(max_length=255)
    option2 = models.CharField(max_length=255)
    option3 = models.CharField(max_length=255)
    option4 = models.CharField(max_length=255)

    correct_option = models.IntegerField(
        choices=[(1, "Option 1"), (2, "Option 2"), (3, "Option 3"), (4, "Option 4")], default=1
    )

    def __str__(self):
        return self.text




class Assignment(models.Model):
    test = models.ForeignKey("Test", on_delete=models.CASCADE, related_name="assignments")
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="assignments")
    assigned_at = models.DateTimeField(default=timezone.now)
    completed = models.BooleanField(default=False)
    score = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.student.username} -> {self.test.title}"


