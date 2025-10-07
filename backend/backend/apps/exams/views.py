# from django.shortcuts import render
# from rest_framework.decorators import action
# from rest_framework import viewsets, permissions
# from .models import Test, Question, Submission, Assignment
# from .serializers import TestSerializer, QuestionSerializer, SubmissionSerializer, AssignmentSerializer

# class TestViewSet(viewsets.ModelViewSet):
#     queryset = Test.objects.all()
#     serializer_class = TestSerializer




# # class AssignmentViewSet(viewsets.ModelViewSet):
# #     queryset = Assignment.objects.all()
# #     serializer_class = AssignmentSerializer
# #     permission_classes = [permissions.IsAuthenticated]
# class AssignmentViewSet(viewsets.ModelViewSet):
#     queryset = Assignment.objects.all()
#     serializer_class = AssignmentSerializer

#     @action(detail=True, methods=["post"])
#     def start(self, request, pk=None):
#         assignment = self.get_object()

#         if assignment.status == "not_started":
#             assignment.start_exam()
#             return Response({
#                 "message": "Exam started",
#                 "start_time": assignment.start_time,
#                 "end_time": assignment.end_time,
#                 "duration": assignment.test.duration_minutes
#             })
#         return Response({"error": "Exam already started or completed"}, status=status.HTTP_400_BAD_REQUEST)

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from .models import Test, Question, Assignment
from .serializers import TestSerializer, QuestionSerializer, AssignmentSerializer
from rest_framework import viewsets, permissions

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer

class TestViewSet(viewsets.ModelViewSet):
    queryset = Test.objects.all()
    serializer_class = TestSerializer

class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:  
            return Assignment.objects.all()
        return Assignment.objects.filter(student=user)