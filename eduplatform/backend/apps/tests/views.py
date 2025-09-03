from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Avg
from django.utils import timezone

# from eduplatform.backend.apps.users import models
from apps.users import models
# from apps.users import models
from apps.users.models import User

from .models import TestGroup, Question, StudentTestAttempt, StudentAnswer
from .serializers import (
    TestGroupSerializer, TestGroupCreateSerializer, TestGroupForStudentSerializer,
    QuestionSerializer, StudentTestAttemptSerializer, StudentTestAttemptCreateSerializer,
    TestCodeAccessSerializer
)

class TestGroupListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'teacher':
            return TestGroup.objects.filter(created_by=user).order_by('-created_at')
        elif user.user_type == 'admin':
            return TestGroup.objects.all().order_by('-created_at')
        else:
            # Students don't see test groups in list view
            return TestGroup.objects.none()
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TestGroupCreateSerializer
        return TestGroupSerializer
    
    def perform_create(self, serializer):
        if self.request.user.user_type not in ['teacher', 'admin']:
            return Response({'error': 'Only teachers and admins can create tests'}, 
                          status=status.HTTP_403_FORBIDDEN)
        serializer.save(created_by=self.request.user)

class TestGroupDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TestGroupSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'teacher':
            return TestGroup.objects.filter(created_by=user)
        elif user.user_type == 'admin':
            return TestGroup.objects.all()
        else:
            return TestGroup.objects.none()

class AccessTestByCodeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if request.user.user_type != 'student':
            return Response({'error': 'Only students can access tests by code'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        serializer = TestCodeAccessSerializer(data=request.data)
        if serializer.is_valid():
            test_code = serializer.validated_data['test_code']
            test_group = get_object_or_404(TestGroup, test_code=test_code, is_active=True)
            
            # Check if student already attempted this test
            existing_attempt = StudentTestAttempt.objects.filter(
                test_group=test_group, 
                student=request.user
            ).first()
            
            if existing_attempt:
                return Response({
                    'error': 'You have already attempted this test',
                    'attempt': StudentTestAttemptSerializer(existing_attempt).data
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Return test details without correct answers
            test_data = TestGroupForStudentSerializer(test_group).data
            return Response(test_data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class StartTestAttemptView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if request.user.user_type != 'student':
            return Response({'error': 'Only students can start test attempts'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        test_code = request.data.get('test_code')
        if not test_code:
            return Response({'error': 'test_code is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        test_group = get_object_or_404(TestGroup, test_code=test_code, is_active=True)
        
        # Check if student already has an attempt
        existing_attempt = StudentTestAttempt.objects.filter(
            test_group=test_group, 
            student=request.user
        ).first()
        
        if existing_attempt:
            return Response({'error': 'Test already started or completed'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Create new attempt
        attempt = StudentTestAttempt.objects.create(
            test_group=test_group,
            student=request.user,
            total_marks=test_group.total_marks
        )
        
        return Response({
            'attempt_id': attempt.id,
            'test': TestGroupForStudentSerializer(test_group).data,
            'time_limit': test_group.time_limit,
            'started_at': attempt.started_at
        })

class SubmitTestAttemptView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if request.user.user_type != 'student':
            return Response({'error': 'Only students can submit tests'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        attempt_id = request.data.get('attempt_id')
        answers = request.data.get('answers', [])
        
        if not attempt_id:
            return Response({'error': 'attempt_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        attempt = get_object_or_404(
            StudentTestAttempt, 
            id=attempt_id, 
            student=request.user, 
            status='in_progress'
        )
        
        # Calculate time taken
        time_taken = (timezone.now() - attempt.started_at).seconds // 60
        attempt.time_taken = time_taken
        
        # Save answers
        for answer_data in answers:
            question_id = answer_data.get('question_id')
            choice_id = answer_data.get('choice_id')
            
            if question_id and choice_id:
                StudentAnswer.objects.update_or_create(
                    attempt=attempt,
                    question_id=question_id,
                    defaults={'selected_choice_id': choice_id}
                )
        
        # Calculate score and complete attempt
        attempt.calculate_score()
        attempt.status = 'completed'
        attempt.completed_at = timezone.now()
        attempt.save()
        
        return Response(StudentTestAttemptSerializer(attempt).data)

class StudentTestAttemptsView(generics.ListAPIView):
    serializer_class = StudentTestAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'student':
            return StudentTestAttempt.objects.filter(student=user).order_by('-started_at')
        elif user.user_type == 'teacher':
            return StudentTestAttempt.objects.filter(
                test_group__created_by=user
            ).order_by('-started_at')
        else:  # admin
            return StudentTestAttempt.objects.all().order_by('-started_at')

class TestResultDetailView(generics.RetrieveAPIView):
    serializer_class = StudentTestAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'student':
            return StudentTestAttempt.objects.filter(student=user, status='completed')
        elif user.user_type == 'teacher':
            return StudentTestAttempt.objects.filter(
                test_group__created_by=user, 
                status='completed'
            )
        else:  # admin
            return StudentTestAttempt.objects.filter(status='completed')

class TeacherTestStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, test_group_id):
        if request.user.user_type not in ['teacher', 'admin']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        test_group = get_object_or_404(TestGroup, id=test_group_id)
        
        if request.user.user_type == 'teacher' and test_group.created_by != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        attempts = StudentTestAttempt.objects.filter(test_group=test_group, status='completed')
        
        stats = {
            'test_group': TestGroupSerializer(test_group).data,
            'total_attempts': attempts.count(),
            'average_score': attempts.aggregate(avg=Avg('percentage'))['avg'] or 0,
            'highest_score': attempts.aggregate(max=models.Max('percentage'))['max'] or 0,
            'lowest_score': attempts.aggregate(min=models.Min('percentage'))['min'] or 0,
            'pass_rate': (attempts.filter(percentage__gte=test_group.passing_marks).count() / attempts.count() * 100) if attempts.count() > 0 else 0,
            'recent_attempts': StudentTestAttemptSerializer(attempts.order_by('-completed_at')[:10], many=True).data
        }
        
        return Response(stats)