from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Avg
from .models import Test, Question, TestAssignment, TestAttempt, Answer
from .serializers import (
    TestSerializer, TestCreateSerializer, QuestionSerializer,
    TestAssignmentSerializer, TestAttemptSerializer, TestAttemptCreateSerializer
)

class TestListCreateView(generics.ListCreateAPIView):
    serializer_class = TestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'teacher':
            return Test.objects.filter(created_by=user)
        elif user.user_type == 'admin':
            return Test.objects.all()
        else:
            # Students see only assigned tests
            return Test.objects.filter(assignments__assigned_to=user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TestCreateSerializer
        return TestSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class TestDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'teacher':
            return Test.objects.filter(created_by=user)
        elif user.user_type == 'admin':
            return Test.objects.all()
        else:
            return Test.objects.filter(assignments__assigned_to=user)

class TestAssignView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if request.user.user_type not in ['teacher', 'admin']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        test_id = request.data.get('test_id')
        student_ids = request.data.get('student_ids', [])
        due_date = request.data.get('due_date')
        
        if not test_id or not student_ids:
            return Response({'error': 'test_id and student_ids are required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        test = get_object_or_404(Test, id=test_id)
        assignments = []
        
        for student_id in student_ids:
            assignment, created = TestAssignment.objects.get_or_create(
                test=test,
                assigned_to_id=student_id,
                defaults={
                    'assigned_by': request.user,
                    'due_date': due_date
                }
            )
            if created:
                assignments.append(assignment)
        
        serializer = TestAssignmentSerializer(assignments, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class AssignedTestsView(generics.ListAPIView):
    serializer_class = TestAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'student':
            return TestAssignment.objects.filter(assigned_to=user)
        elif user.user_type == 'teacher':
            return TestAssignment.objects.filter(assigned_by=user)
        else:  # admin
            return TestAssignment.objects.all()

class TestAttemptCreateView(generics.CreateAPIView):
    serializer_class = TestAttemptCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        # Check if user is a student
        if self.request.user.user_type != 'student':
            return Response({'error': 'Only students can take tests'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        assignment_id = self.request.data.get('assignment')
        assignment = get_object_or_404(TestAssignment, id=assignment_id, assigned_to=self.request.user)
        
        # Check if already attempted
        if TestAttempt.objects.filter(assignment=assignment, student=self.request.user).exists():
            return Response({'error': 'Test already attempted'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        serializer.save()

class TestAttemptListView(generics.ListAPIView):
    serializer_class = TestAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'student':
            return TestAttempt.objects.filter(student=user)
        elif user.user_type == 'teacher':
            return TestAttempt.objects.filter(assignment__assigned_by=user)
        else:  # admin
            return TestAttempt.objects.all()

class TestAttemptDetailView(generics.RetrieveAPIView):
    serializer_class = TestAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'student':
            return TestAttempt.objects.filter(student=user)
        elif user.user_type == 'teacher':
            return TestAttempt.objects.filter(assignment__assigned_by=user)
        else:  # admin
            return TestAttempt.objects.all()

class StudentTestsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.user_type != 'student':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get assigned tests
        assigned_tests = TestAssignment.objects.filter(
            assigned_to=request.user
        ).select_related('test')
        
        # Get completed attempts
        completed_attempts = TestAttempt.objects.filter(
            student=request.user,
            status='completed'
        ).select_related('assignment__test')
        
        # Separate pending and completed
        pending_tests = []
        completed_tests = []
        
        for assignment in assigned_tests:
            attempt = TestAttempt.objects.filter(
                assignment=assignment,
                student=request.user
            ).first()
            
            if attempt and attempt.status == 'completed':
                completed_tests.append({
                    'assignment': TestAssignmentSerializer(assignment).data,
                    'attempt': TestAttemptSerializer(attempt).data
                })
            else:
                pending_tests.append(TestAssignmentSerializer(assignment).data)
        
        return Response({
            'pending_tests': pending_tests,
            'completed_tests': completed_tests
        })