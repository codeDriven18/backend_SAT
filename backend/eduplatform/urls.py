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
    path("api/", include("apps.notifications.urls")),
    path("api/notifications/", include("apps.notifications.urls")),

    # JWT token endpoints
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# Serve media files (images, uploads) during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
