from django.urls import path
from .views import (
    TestListCreateView, TestDetailView, TestAssignView,
    AssignedTestsView, TestAttemptCreateView, TestAttemptListView,
    TestAttemptDetailView, StudentTestsView
)

urlpatterns = [
    path('', TestListCreateView.as_view(), name='test-list-create'),
    path('<int:pk>/', TestDetailView.as_view(), name='test-detail'),
    path('assign/', TestAssignView.as_view(), name='test-assign'),
    path('assignments/', AssignedTestsView.as_view(), name='assigned-tests'),
    path('attempts/', TestAttemptListView.as_view(), name='test-attempts'),
    path('attempts/create/', TestAttemptCreateView.as_view(), name='test-attempt-create'),
    path('attempts/<int:pk>/', TestAttemptDetailView.as_view(), name='test-attempt-detail'),
    path('student-tests/', StudentTestsView.as_view(), name='student-tests'),
]