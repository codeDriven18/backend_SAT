from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import teacher_views

router = DefaultRouter()
router.register(r'tests', teacher_views.TeacherTestViewSet, basename='teacher-tests')
router.register(r'groups', teacher_views.StudentGroupViewSet, basename='teacher-groups')
router.register(r'assignments', teacher_views.TestAssignmentViewSet, basename='teacher-assignments')
router.register(r'library', teacher_views.TestLibraryViewSet, basename='test-library')
router.register(r'analytics', teacher_views.TeacherAnalyticsViewSet, basename='teacher-analytics')

urlpatterns = [
    path('', include(router.urls)),
    # Dashboard
    path('dashboard/', teacher_views.TeacherDashboardView.as_view(), name='teacher-dashboard'),
    # Student management
    path('students/search/', teacher_views.SearchStudentsView.as_view(), name='search-students'),
    # Assignment actions
    path('assign-test/', teacher_views.AssignTestToGroupView.as_view(), name='assign-test'),
    
]