from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # Authentication
    path('api/auth/', include('apps.users.urls')),
    
    # Separate domains for different user types
    path('api/student/', include('apps.tests.student_urls')),
    path('api/teacher/', include('apps.tests.teacher_urls')),
    
    # Analytics
    path('api/analytics/', include('apps.analytics.urls')),
]
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.api.urls')),  # DRF endpoints

    # Student frontend
    re_path(r'^student/.*$', TemplateView.as_view(template_name="student-index.html"), name='student-frontend'),

    # Teacher frontend
    re_path(r'^teacher/.*$', TemplateView.as_view(template_name="teacher-index.html"), name='teacher-frontend'),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)