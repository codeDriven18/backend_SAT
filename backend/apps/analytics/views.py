from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.generics import GenericAPIView
from rest_framework import serializers
from django.db.models import Avg, Max
from django.utils import timezone
from datetime import timedelta
from apps.users.models import User
from apps.tests.models import TestGroup, StudentTestAttempt


class DashboardStatsSerializer(serializers.Serializer):
    overview = serializers.DictField(child=serializers.FloatField(), required=False)
    performance = serializers.DictField(child=serializers.FloatField(), required=False)
    recent_tests = serializers.ListField(child=serializers.DictField(), required=False)
    performance_chart = serializers.ListField(child=serializers.DictField(), required=False)


class DashboardStatsView(GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DashboardStatsSerializer

    def get(self, request):
        user = request.user

        if user.user_type == 'student':
            return self.get_student_stats(user)
        elif user.user_type == 'teacher':
            return self.get_teacher_stats(user)
        elif user.user_type == 'admin':
            return self.get_admin_stats(user)

        return Response({'error': 'Invalid user type'}, status=400)

    def get_student_stats(self, user):
#
        student_groups = user.groups.all()  
        assigned_tests = TestGroup.objects.filter(group__in=student_groups, is_active=True)

        total_assigned = assigned_tests.count()
        attempts = StudentTestAttempt.objects.filter(
            student=user, test_group__in=assigned_tests, status='completed'
        )
#
        attempts = StudentTestAttempt.objects.filter(student=user, status='completed')

        # total_assigned = TestGroup.objects.filter(is_active=True).count()
        completed = attempts.count()
        pending = max(total_assigned - completed, 0)

        avg_score = attempts.aggregate(avg=Avg('percentage'))['avg'] or 0
        highest_score = attempts.aggregate(max=Max('percentage'))['max'] or 0
        recent_attempts = attempts.order_by('-completed_at')[:5]

        performance_data = []
        for i, attempt in enumerate(attempts.order_by('-completed_at')[:8][::-1]):
            performance_data.append({
                'test': attempt.test_group.title,
                'score': attempt.percentage,
                'date': attempt.completed_at.strftime('%Y-%m-%d') if attempt.completed_at else None
            })
        return Response({
            'overview': {
                'total_assigned': total_assigned,
                'completed': completed,
                'pending': pending,
                'avg_score': round(avg_score, 1),
            },
            'performance': {
                'average_score': round(avg_score, 1),
                'highest_score': round(highest_score, 1),
                'total_time_spent': sum(a.time_taken for a in attempts),
                'completion_rate': round((completed / total_assigned * 100), 1) if total_assigned > 0 else 0
            },
            'recent_tests': [
                {
                    'title': attempt.test_group.title,
                    'score': attempt.percentage,
                    'status': attempt.status,
                    'date': attempt.completed_at.strftime('%Y-%m-%d') if attempt.completed_at else None,
                    'time_taken': attempt.time_taken
                } for attempt in recent_attempts
            ],
            'performance_chart': performance_data
        })

    def get_teacher_stats(self, user):
        tests = TestGroup.objects.filter(created_by=user)
        attempts = StudentTestAttempt.objects.filter(test_group__created_by=user, status='completed')

        total_tests = tests.count()
        total_students = User.objects.filter(user_type='student', test_attempts__test_group__in=tests).distinct().count()
        completed_attempts = attempts.count()

        avg_class_score = attempts.aggregate(avg=Avg('percentage'))['avg'] or 0

        recent_attempts = attempts.order_by('-completed_at')[:10]

        student_performance = []
        students = User.objects.filter(user_type='student', test_attempts__test_group__in=tests).distinct()
        for student in students[:10]:
            student_attempts = attempts.filter(student=student)
            if student_attempts.exists():
                avg_score = student_attempts.aggregate(avg=Avg('percentage'))['avg']
                student_performance.append({
                    'name': student.get_full_name() or student.username,
                    'score': round(avg_score, 1)
                })

        student_performance = sorted(student_performance, key=lambda x: x['score'], reverse=True)

        return Response({
            'overview': {
                'total_tests': total_tests,
                'total_students': total_students,
                'avg_class_score': round(avg_class_score, 1),
            },
            'performance': {
                'tests_created': total_tests,
                'completion_rate': round((completed_attempts / total_tests * 100), 1) if total_tests > 0 else 0,
                'average_class_score': round(avg_class_score, 1)
            },
            'recent_results': [
                {
                    'student': attempt.student.get_full_name() or attempt.student.username,
                    'test': attempt.test_group.title,
                    'score': attempt.percentage,
                    'date': attempt.completed_at.strftime('%Y-%m-%d') if attempt.completed_at else None
                } for attempt in recent_attempts
            ],
            'student_performance': student_performance,
        })

    def get_admin_stats(self, user):
        total_users = User.objects.count()
        total_students = User.objects.filter(user_type='student').count()
        total_teachers = User.objects.filter(user_type='teacher').count()
        total_tests = TestGroup.objects.count()
        total_attempts = StudentTestAttempt.objects.filter(status='completed').count()

        recent_users = User.objects.order_by('-date_joined')[:10]

        activity_data = []
        for i in range(7):
            date = timezone.now() - timedelta(days=i)
            day_attempts = StudentTestAttempt.objects.filter(
                completed_at__date=date.date(),
                status='completed'
            ).count()
            activity_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'attempts': day_attempts
            })

        activity_data.reverse()

        user_distribution = [
            {'type': 'Students', 'count': total_students, 'percentage': round((total_students / total_users * 100), 1) if total_users > 0 else 0},
            {'type': 'Teachers', 'count': total_teachers, 'percentage': round((total_teachers / total_users * 100), 1) if total_users > 0 else 0},
            {'type': 'Admins', 'count': total_users - total_students - total_teachers, 'percentage': round(((total_users - total_students - total_teachers) / total_users * 100), 1) if total_users > 0 else 0}
        ]

        return Response({
            'overview': {
                'total_users': total_users,
                'total_students': total_students,
                'total_teachers': total_teachers,
                'total_tests': total_tests
            },
            'activity': {
                'total_attempts': total_attempts,
                'active_tests': TestGroup.objects.filter(is_active=True).count(),
                'recent_signups': User.objects.filter(
                    date_joined__gte=timezone.now() - timedelta(days=7)
                ).count()
            },
            'recent_users': [
                {
                    'username': u.username,
                    'user_type': u.user_type,
                    'date_joined': u.date_joined.strftime('%Y-%m-%d')
                } for u in recent_users
            ],
            'activity_chart': activity_data,
            'user_distribution': user_distribution
        })
