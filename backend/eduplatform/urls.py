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

    # Student + Teacher APIs
    path('api/student/', include('apps.tests.student_urls')),
    path('api/teacher/', include('apps.tests.teacher_urls')),

    # Analytics
    path('api/analytics/', include('apps.analytics.urls')),

    # Frontend entrypoints
    re_path(r'^student/.*$', TemplateView.as_view(template_name="student-frontend/dist/index.html")),
    re_path(r'^teacher/.*$', TemplateView.as_view(template_name="teacher-frontend/dist/index.html")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
