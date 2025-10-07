from django.contrib import admin

from django.contrib import admin
from .models import Test, Question, Assignment

admin.site.register(Test)
admin.site.register(Question)

admin.site.register(Assignment)

# Register your models here.
