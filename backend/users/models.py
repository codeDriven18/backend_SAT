# from django.db import models
# from django.contrib.auth.models import AbstractUser
# # Create your models here.

# class User(AbstractUser):
#     is_teacher = models.BooleanField(default=False)

#     def __str__(self):
#         return self.username

from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')

    def __str__(self):
        return f"{self.username} ({self.role})"