from django.contrib import admin
from .models import DashboardStats, ActivityLog

@admin.register(DashboardStats)
class DashboardStatsAdmin(admin.ModelAdmin):
    list_display = ('user', 'total_tests', 'completed_tests', 'average_score', 'last_updated')
    list_filter = ('last_updated',)
    search_fields = ('user__username',)

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'activity_type', 'description', 'timestamp')
    list_filter = ('activity_type', 'timestamp')
    search_fields = ('user__username', 'description')
    readonly_fields = ('timestamp',)