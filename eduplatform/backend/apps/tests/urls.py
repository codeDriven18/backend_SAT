from django.urls import path
from .views import (
    TestGroupListCreateView, TestGroupDetailView, AccessTestByCodeView,
    StartTestAttemptView, SubmitTestAttemptView, StudentTestAttemptsView,
    TestResultDetailView, TeacherTestStatsView
)

urlpatterns = [
    # Teacher/Admin test management
    path('', TestGroupListCreateView.as_view(), name='testgroup-list-create'),
    path('<int:pk>/', TestGroupDetailView.as_view(), name='testgroup-detail'),
    path('<int:test_group_id>/stats/', TeacherTestStatsView.as_view(), name='test-stats'),
    
    # Student test access
    path('access-by-code/', AccessTestByCodeView.as_view(), name='access-test-by-code'),
    path('start-attempt/', StartTestAttemptView.as_view(), name='start-test-attempt'),
    path('submit-attempt/', SubmitTestAttemptView.as_view(), name='submit-test-attempt'),
    
    # Test results
    path('attempts/', StudentTestAttemptsView.as_view(), name='test-attempts'),
    path('results/<int:pk>/', TestResultDetailView.as_view(), name='test-result-detail'),
]