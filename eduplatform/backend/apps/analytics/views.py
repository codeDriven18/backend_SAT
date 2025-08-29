from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Avg, Q, Max
from django.utils import timezone
from datetime import datetime, timedelta
from apps.users.models import User, StudentProfile, TeacherProfile
from apps.tests.models import Test, TestAssignment, TestAttempt

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
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
        # Get student assignments and attempts
        assignments = TestAssignment.objects.filter(assigned_to=user)
        attempts = TestAttempt.objects.filter(student=user, status='completed')
        
        # Calculate stats
        total_assigned = assignments.count()
        completed = attempts.count()
        pending = total_assigned - completed
        
        if attempts.exists():
            avg_score = attempts.aggregate(avg=Avg('percentage'))['avg'] or 0
            highest_score = attempts.aggregate(max=Max('percentage'))['max'] or 0
            recent_attempts = attempts.order_by('-completed_at')[:5]
        else:
            avg_score = 0
            highest_score = 0
            recent_attempts = []
        
        # Performance over time (last 8 attempts)
        performance_data = []
        recent_performance = attempts.order_by('-completed_at')[:8][::-1]
        
        for i, attempt in enumerate(recent_performance):
            performance_data.append({
                'test': i + 1,
                'score': attempt.percentage,
                'date': attempt.completed_at.strftime('%Y-%m-%d')
            })
        
        return Response({
            'overview': {
                'total_assigned': total_assigned,
                'completed': completed,
                'pending': pending,
                'avg_score': round(avg_score, 1) if avg_score else 0
            },
            'performance': {
                'average_score': round(avg_score, 1) if avg_score else 0,
                'highest_score': round(highest_score, 1) if highest_score else 0,
                'total_time_spent': sum(attempt.time_taken for attempt in attempts),
                'completion_rate': round((completed / total_assigned * 100), 1) if total_assigned > 0 else 0
            },
            'recent_tests': [
                {
                    'title': attempt.assignment.test.title,
                    'score': attempt.percentage,
                    'status': 'completed',
                    'date': attempt.completed_at.strftime('%Y-%m-%d'),
                    'time_taken': attempt.time_taken
                } for attempt in recent_attempts
            ],
            'performance_chart': performance_data
        })
    
    def get_teacher_stats(self, user):
        # Get teacher's tests and assignments
        tests = Test.objects.filter(created_by=user)
        assignments = TestAssignment.objects.filter(assigned_by=user)
        attempts = TestAttempt.objects.filter(assignment__assigned_by=user, status='completed')
        
        # Get students taught by this teacher
        students = User.objects.filter(
            assigned_tests__assigned_by=user,
            user_type='student'
        ).distinct()
        
        # Calculate stats
        total_tests = tests.count()
        total_assignments = assignments.count()
        completed_attempts = attempts.count()
        total_students = students.count()
        
        if attempts.exists():
            avg_class_score = attempts.aggregate(avg=Avg('percentage'))['avg'] or 0
        else:
            avg_class_score = 0
        
        # Recent activity
        recent_attempts = attempts.order_by('-completed_at')[:10]
        
        # Student performance data
        student_performance = []
        for student in students[:10]:  # Top 10 students
            student_attempts = attempts.filter(student=student)
            if student_attempts.exists():
                avg_score = student_attempts.aggregate(avg=Avg('percentage'))['avg']
                student_performance.append({
                    'name': student.get_full_name() or student.username,
                    'score': round(avg_score, 1)
                })
        
        student_performance = sorted(student_performance, key=lambda x: x['score'], reverse=True)
        
        # Monthly statistics
        monthly_data = []
        for i in range(12):
            month = timezone.now() - timedelta(days=30*i)
            month_attempts = attempts.filter(
                completed_at__month=month.month,
                completed_at__year=month.year
            )
            monthly_data.append({
                'month': month.strftime('%b'),
                'completed': month_attempts.count(),
                'assigned': assignments.filter(
                    assigned_at__month=month.month,
                    assigned_at__year=month.year
                ).count()
            })
        
        monthly_data.reverse()
        
        return Response({
            'overview': {
                'total_tests': total_tests,
                'total_students': total_students,
                'total_assignments': total_assignments,
                'avg_class_score': round(avg_class_score, 1) if avg_class_score else 0
            },
            'performance': {
                'tests_created': total_tests,
                'assignments_given': total_assignments,
                'completion_rate': round((completed_attempts / total_assignments * 100), 1) if total_assignments > 0 else 0,
                'average_class_score': round(avg_class_score, 1) if avg_class_score else 0
            },
            'recent_results': [
                {
                    'student': attempt.student.get_full_name() or attempt.student.username,
                    'test': attempt.assignment.test.title,
                    'score': attempt.percentage,
                    'date': attempt.completed_at.strftime('%Y-%m-%d')
                } for attempt in recent_attempts
            ],
            'student_performance': student_performance,
            'monthly_chart': monthly_data
        })
    
    def get_admin_stats(self, user):
        # Overall platform statistics
        total_users = User.objects.count()
        total_students = User.objects.filter(user_type='student').count()
        total_teachers = User.objects.filter(user_type='teacher').count()
        total_tests = Test.objects.count()
        total_attempts = TestAttempt.objects.filter(status='completed').count()
        
        # Recent registrations
        recent_users = User.objects.order_by('-date_joined')[:10]
        
        # Platform activity over time
        activity_data = []
        for i in range(7):
            date = timezone.now() - timedelta(days=i)
            day_attempts = TestAttempt.objects.filter(
                completed_at__date=date.date(),
                status='completed'
            ).count()
            activity_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'attempts': day_attempts
            })
        
        activity_data.reverse()
        
        # User type distribution
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
                'active_tests': Test.objects.filter(is_active=True).count(),
                'recent_signups': User.objects.filter(
                    date_joined__gte=timezone.now() - timedelta(days=7)
                ).count()
            },
            'recent_users': [
                {
                    'username': user.username,
                    'user_type': user.user_type,
                    'date_joined': user.date_joined.strftime('%Y-%m-%d')
                } for user in recent_users
            ],
            'activity_chart': activity_data,
            'user_distribution': user_distribution
        })