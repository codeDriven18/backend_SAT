from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TestViewSet, QuestionViewSet, AssignmentViewSet

router = DefaultRouter()
router.register(r'tests', TestViewSet)
router.register(r'questions', QuestionViewSet)
router.register(r'assignments', AssignmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
