from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from apps.tests.models import StudentTestAttempt, TestGroup, DashboardStats, ActivityLog
from apps.users.models import User



def update_dashboard_stats(user):
    """Recalculate and update DashboardStats for a user."""
    stats, _ = DashboardStats.objects.get_or_create(user=user)

    attempts = StudentTestAttempt.objects.filter(student=user, status='completed')
    stats.total_tests = TestGroup.objects.filter(is_active=True).count()
    stats.completed_tests = attempts.count()

    if attempts.exists():
        stats.average_score = attempts.aggregate(avg=models.Avg("percentage"))["avg"] or 0
        stats.highest_score = attempts.aggregate(max=models.Max("percentage"))["max"] or 0
    else:
        stats.average_score = 0
        stats.highest_score = 0

    # For teachers, count students & assignments
    if user.user_type == "teacher":
        stats.total_students = User.objects.filter(user_type="student").count()
        stats.active_assignments = TestGroup.objects.filter(created_by=user, is_active=True).count()

    stats.save()
    return stats


def log_activity(user, activity_type, description, metadata=None):
    """Create an activity log entry."""
    ActivityLog.objects.create(
        user=user,
        activity_type=activity_type,
        description=description,
        metadata=metadata or {},
        timestamp=timezone.now(),
    )


@receiver(post_save, sender=StudentTestAttempt)
def update_stats_on_attempt(sender, instance, created, **kwargs):
    """Update stats when a student finishes a test attempt."""
    if instance.status == "completed":
        update_dashboard_stats(instance.student)
        log_activity(
            instance.student,
            "test_completed",
            f"Completed test {instance.test_group.title} with {instance.percentage:.1f}%",
            {"score": instance.score, "percentage": instance.percentage},
        )


@receiver(post_save, sender=TestGroup)
def update_stats_on_test(sender, instance, created, **kwargs):
    """Update teacher stats when a test is created."""
    if created:
        update_dashboard_stats(instance.created_by)
        log_activity(
            instance.created_by,
            "test_created",
            f"Created test '{instance.title}'",
            {"test_id": instance.id},
        )


@receiver(post_save, sender=User)
def update_stats_on_user(sender, instance, created, **kwargs):
    """Update global stats when a new user registers."""
    if created:
        update_dashboard_stats(instance)
        log_activity(
            instance,
            "user_registered",
            f"New {instance.user_type} registered: {instance.username}",
        )
