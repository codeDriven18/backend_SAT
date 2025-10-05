from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from .models import *
from .serializers import *
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

class TeacherDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['Teacher Dashboard'],
        summary='Teacher Dashboard Statistics',
        description='Get overview statistics for teacher dashboard including tests created, groups managed, and recent activity.',
        responses={
            200: {
                'description': 'Dashboard statistics',
                'content': {
                    'application/json': {
                        'example': {
                            'total_tests': 15,
                            'total_groups': 4,
                            'total_students': 87,
                            'active_assignments': 12,
                            'recent_attempts': [
                                {
                                    'id': 123,
                                    'student_name': 'john_doe',
                                    'test_title': 'SAT Math Practice',
                                    'status': 'completed',
                                    'percentage': 85.5,
                                    'started_at': '2024-01-15T10:30:00Z'
                                }
                            ]
                        }
                    }
                }
            },
            403: {
                'description': 'Only teachers can access this endpoint',
                'content': {
                    'application/json': {
                        'example': {'error': 'Only teachers can access this'}
                    }
                }
            }
        }
    )
    
    def get(self, request):
        if request.user.user_type != 'teacher':
            return Response({'error': 'Only teachers can access this'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Dashboard statistics
        total_tests = TestGroup.objects.filter(created_by=request.user).count()
        total_groups = StudentGroup.objects.filter(teacher=request.user).count()
        total_students = User.objects.filter(
            student_groups__teacher=request.user,
            user_type='student'
        ).distinct().count()
        active_assignments = TestAssignment.objects.filter(
            assigned_by=request.user,
            is_active=True
        ).count()
        
        # Recent test attempts
        recent_attempts = StudentTestAttempt.objects.filter(
            test_group__created_by=request.user
        ).order_by('-started_at')[:5]
        
        return Response({
            'total_tests': total_tests,
            'total_groups': total_groups,
            'total_students': total_students,
            'active_assignments': active_assignments,
            'recent_attempts': StudentTestAttemptSerializer(recent_attempts, many=True).data
        })

class TeacherTestViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TestGroupSerializer
    
    def get_queryset(self):
        if self.request.user.user_type == 'teacher':
            return TestGroup.objects.filter(created_by=self.request.user).order_by('-created_at')
        return TestGroup.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TestGroupCreateSerializer
        return TestGroupSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

# class TestLibraryViewSet(viewsets.ReadOnlyModelViewSet):
#     """All tests visible to all teachers for reuse"""
#     permission_classes = [IsAuthenticated]
#     serializer_class = TestGroupLibrarySerializer
    
#     def get_queryset(self):
#         if self.request.user.user_type == 'teacher':
#             return TestGroup.objects.filter(is_active=True, is_public=True).order_by('-created_at')
#         return TestGroup.objects.none()
    
#     @action(detail=True, methods=['get'])
#     def preview(self, request, pk=None):
#         """Preview test details with sections but no questions"""
#         test = self.get_object()
#         sections_data = []
        
#         for section in test.sections.all():
#             sections_data.append({
#                 'id': section.id,
#                 'name': section.name,
#                 'time_limit': section.time_limit,
#                 'question_count': section.questions.count()
#             })
        
#         return Response({
#             'id': test.id,
#             'title': test.title,
#             'description': test.description,
#             'created_by': test.created_by.username,
#             'difficulty': test.difficulty,
#             'total_marks': test.total_marks,
#             'passing_marks': test.passing_marks,
#             'created_at': test.created_at,
#             'sections': sections_data
#         })


class TestLibraryViewSet(viewsets.ReadOnlyModelViewSet):
    """All tests visible to all teachers for reuse"""
    permission_classes = [IsAuthenticated]
    serializer_class = TestGroupLibrarySerializer

    def get_queryset(self):
        user = self.request.user
       
        return (
            TestGroup.objects
            .filter(is_active=True)
            # .filter(Q(is_public=True) | Q(created_by=user))
            
            .select_related("created_by")
            .prefetch_related("sections", "sections__questions")
            .order_by("-created_at")
        )

    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Preview test details with sections but no questions"""
        test = self.get_object()  
        sections_data = [{
            'id': s.id,
            'name': s.name,
            'time_limit': s.time_limit,
            'question_count': s.questions.count()
        } for s in test.sections.all()]
        return Response({
            'id': test.id,
            'title': test.title,
            'description': test.description,
            'created_by': test.created_by.username,
            'difficulty': test.difficulty,
            'total_marks': test.total_marks,
            'passing_marks': test.passing_marks,
            'created_at': test.created_at,
            'sections': sections_data
        })


class StudentGroupViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = StudentGroupSerializer
    
    def get_queryset(self):
        if self.request.user.user_type == 'teacher':
            return StudentGroup.objects.filter(teacher=self.request.user).order_by('-created_at')
        return StudentGroup.objects.none()

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)

    @action(detail=True, methods=['post'], serializer_class=AddRemoveStudentSerializer)
    def add_student(self, request, pk=None):
        serializer = AddRemoveStudentSerializer(data=request.data)
        if serializer.is_valid():
            student_id = serializer.validated_data['student_id']
            group = self.get_object()
            
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                student = User.objects.get(id=student_id, user_type='student')
                
                if student in group.students.all():
                    return Response({
                        'error': f'Student {student.username} is already in this group'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                group.students.add(student)
                return Response({
                    'message': f'Student {student.username} added to group successfully',
                    'student': {
                        'id': student.id,
                        'username': student.username,
                        'full_name': f"{student.first_name} {student.last_name}".strip()
                    }
                })
            except User.DoesNotExist:
                return Response({
                    'error': 'Student not found'
                }, status=status.HTTP_404_NOT_FOUND)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], serializer_class=AddRemoveStudentSerializer)
    def remove_student(self, request, pk=None):
        serializer = AddRemoveStudentSerializer(data=request.data)
        if serializer.is_valid():
            student_id = serializer.validated_data['student_id']
            group = self.get_object()
            
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                student = User.objects.get(id=student_id, user_type='student')
                
                if student not in group.students.all():
                    return Response({
                        'error': f'Student {student.username} is not in this group'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                group.students.remove(student)
                return Response({
                    'message': f'Student {student.username} removed from group successfully',
                    'student': {
                        'id': student.id,
                        'username': student.username,
                        'full_name': f"{student.first_name} {student.last_name}".strip()
                    }
                })
            except User.DoesNotExist:
                return Response({
                    'error': 'Student not found'
                }, status=status.HTTP_404_NOT_FOUND)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TestAssignmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TestAssignmentSerializer
    
    def get_queryset(self):
        if self.request.user.user_type == 'teacher':
            return TestAssignment.objects.filter(assigned_by=self.request.user).order_by('-assigned_at')
        return TestAssignment.objects.none()

class AssignTestToGroupView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['Teacher Assignments'],
        summary='Assign Test to Group',
        description='Assign a test from the library to one of teacher\'s groups. This makes the test appear on all group members\' dashboards.',
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'test_id': {'type': 'integer', 'example': 5},
                    'group_id': {'type': 'integer', 'example': 2}
                },
                'required': ['test_id', 'group_id']
            }
        },
        responses={
            200: {
                'description': 'Test assigned successfully',
                'content': {
                    'application/json': {
                        'example': {
                            'message': 'Test "SAT Math Practice" assigned to group "Class A"',
                            'assignment_id': 45,
                            'students_count': 25
                        }
                    }
                }
            },
            400: {
                'description': 'Test already assigned to this group',
                'content': {
                    'application/json': {
                        'example': {'error': 'Test already assigned to this group'}
                    }
                }
            },
            404: {
                'description': 'Test or group not found',
                'content': {
                    'application/json': {
                        'example': {'error': 'Test not found'}
                    }
                }
            }
        }
    )
    
    def post(self, request):
        if request.user.user_type != 'teacher':
            return Response({'error': 'Only teachers can assign tests'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        test_id = request.data.get('test_id')
        group_id = request.data.get('group_id')
        
        try:
            test_group = TestGroup.objects.get(id=test_id, is_active=True)
            student_group = StudentGroup.objects.get(id=group_id, teacher=request.user)
            
            # Check if already assigned
            if TestAssignment.objects.filter(test_group=test_group, student_group=student_group).exists():
                return Response({'error': 'Test already assigned to this group'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            assignment = TestAssignment.objects.create(
                test_group=test_group,
                student_group=student_group,
                assigned_by=request.user
            )
            
            return Response({
                'message': f'Test "{test_group.title}" assigned to group "{student_group.name}"',
                'assignment_id': assignment.id,
                'students_count': student_group.student_count
            })
            
        except TestGroup.DoesNotExist:
            return Response({'error': 'Test not found'}, status=status.HTTP_404_NOT_FOUND)
        except StudentGroup.DoesNotExist:
            return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)

class SearchStudentsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if request.user.user_type != 'teacher':
            return Response({'error': 'Only teachers can search students'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        query = request.query_params.get('q', '')
        students = User.objects.filter(
            user_type='student'
        ).filter(
            Q(username__icontains=query) | 
            Q(first_name__icontains=query) | 
            Q(last_name__icontains=query)
        )[:20]
        
        return Response([
            {
                'id': student.id,
                'username': student.username,
                'first_name': student.first_name,
                'last_name': student.last_name,
                'full_name': f"{student.first_name} {student.last_name}".strip() or student.username
            }
            for student in students
        ])

class TeacherAnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def test_analytics(self, request):
        """Analytics for a specific test"""
        test_id = request.query_params.get('test_id')
        if not test_id:
            return Response({'error': 'test_id parameter required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        test = get_object_or_404(TestGroup, id=test_id, created_by=request.user)
        attempts = StudentTestAttempt.objects.filter(test_group=test, status='completed')
        
        if not attempts.exists():
            return Response({
                'test_title': test.title,
                'total_attempts': 0,
                'analytics': 'No completed attempts yet'
            })
        
        # Calculate statistics
        from django.db.models import Avg, Max, Min
        stats = attempts.aggregate(
            avg_score=Avg('percentage'),
            max_score=Max('percentage'),
            min_score=Min('percentage'),
            avg_total_score=Avg('total_score')
        )
        
        # Pass rate
        pass_rate = (attempts.filter(total_score__gte=test.passing_marks).count() / attempts.count() * 100)
        
        # Section-wise analytics
        section_stats = []
        for section in test.sections.all():
            section_attempts = SectionAttempt.objects.filter(
                test_attempt__in=attempts,
                section=section,
                status='completed'
            )
            if section_attempts.exists():
                section_avg = section_attempts.aggregate(avg=Avg('score'))['avg']
                section_stats.append({
                    'section_name': section.name,
                    'average_score': round(section_avg, 2),
                    'total_marks': section_attempts.first().total_marks
                })
        
        return Response({
            'test_title': test.title,
            'total_attempts': attempts.count(),
            'average_percentage': round(stats['avg_score'], 2) if stats['avg_score'] else 0,
            'highest_percentage': stats['max_score'],
            'lowest_percentage': stats['min_score'],
            'pass_rate': round(pass_rate, 2),
            'section_analytics': section_stats,
            'recent_attempts': StudentTestAttemptSerializer(
                attempts.order_by('-completed_at')[:10], many=True
            ).data
        })

        if getattr(self, "swagger_fake_view", False):
            return Model.objects.none()
