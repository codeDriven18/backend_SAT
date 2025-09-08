from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import student_views

router = DefaultRouter()
router.register(r'dashboard', student_views.StudentDashboardViewSet, basename='student-dashboard')
router.register(r'attempts', student_views.StudentTestAttemptViewSet, basename='student-attempts')

urlpatterns = [
    path('', include(router.urls)),
    # Test taking
    path('test/<int:test_id>/start/', student_views.StartTestView.as_view(), name='start-test'),
    path('test/<int:test_id>/section/<int:section_id>/start/', student_views.StartSectionView.as_view(), name='start-section'),
    path('test/<int:test_id>/section/<int:section_id>/questions/', student_views.GetSectionQuestionsView.as_view(), name='section-questions'),
    path('test/<int:test_id>/submit-answer/', student_views.SubmitAnswerView.as_view(), name='submit-answer'),
    path('test/<int:test_id>/section/<int:section_id>/complete/', student_views.CompleteSectionView.as_view(), name='complete-section'),
    path('test/<int:test_id>/complete/', student_views.CompleteTestView.as_view(), name='complete-test'),
    # Results and Review
    path('test/<int:test_id>/results/', student_views.TestResultsView.as_view(), name='test-results'),
    path('test/<int:test_id>/review/', student_views.TestReviewView.as_view(), name='test-review'),
]