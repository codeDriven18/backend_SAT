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

    # Student & Teacher API endpoints
    path('api/student/', include('apps.tests.student_urls')),
    path('api/teacher/', include('apps.tests.teacher_urls')),
    path('api/analytics/', include('apps.analytics.urls')),

    # Frontend routes (catch-all for SPA)
re_path(r'^student/.*$', TemplateView.as_view(template_name="index.html"), name='student-frontend'),
re_path(r'^teacher/.*$', TemplateView.as_view(template_name="index.html"), name='teacher-frontend'),
]

# Serve media in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
