# eduplatform/urls.py
from django.conf import settings
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
# from streamlit import status
from django.conf.urls.static import static


urlpatterns = [
    path('admin/', admin.site.urls),

    # API
    path('api/auth/', include('apps.users.urls')),
    path('api/student/', include('apps.tests.student_urls')),
    path('api/teacher/', include('apps.tests.teacher_urls')),
    path('api/analytics/', include('apps.analytics.urls')),
]

urlpatterns = [
    path("student/", TemplateView.as_view(template_name="index.html"), name="student-index"),
    path("teacher/", TemplateView.as_view(template_name="index.html"), name="teacher-index"),
]

# Serve student frontend
urlpatterns += [
    re_path(r'^student.*$', TemplateView.as_view(template_name="student-index.html")),
]

# Serve teacher frontend
urlpatterns += [
    re_path(r'^teacher.*$', TemplateView.as_view(template_name="teacher-index.html")),
]

# Catch-all (optional: root → student app)
urlpatterns += [
    re_path(r'^(?!api/).*$', TemplateView.as_view(template_name="student-index.html")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)



# from django.views.generic import TemplateView
# from django.urls import path

