from django.urls import path, include
from .views import RegisterView, LoginView, CreateTeacherByAdminView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    # path('me/', MeView.as_view(), name='me'),
    path("create-teacher-by-admin/", CreateTeacherByAdminView.as_view(), name="create-teacher"),
    # path('protected/', views.protected_view, name='protected'),
    path("api/exams/", include("exams.urls")),
    
]
