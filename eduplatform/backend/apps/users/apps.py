# from django.urls import path
# # from rest_framework_simplejwt.views import TokenRefreshView
# from .views import RegisterView, LoginView, ProfileView, UserListView, StudentListView

# urlpatterns = [
#     path('register/', RegisterView.as_view(), name='register'),
#     path('login/', LoginView.as_view(), name='login'),
#     # path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
#     path('profile/', ProfileView.as_view(), name='profile'),
#     path('users/', UserListView.as_view(), name='user-list'),
#     path('students/', StudentListView.as_view(), name='student-list'),
# ]

from django.apps import AppConfig

class UsersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.users"

