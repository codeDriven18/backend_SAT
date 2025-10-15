from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q, Avg, Max, Min
from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    OpenApiParameter,
    OpenApiTypes,
)
from .models import *
from .serializers import *
from apps.users.models import User


# ───────────────────────────────────────────────
# 🔹 Teacher Dashboard
# ───────────────────────────────────────────────
@extend_schema(
    tags=['Teacher Dashboard'],
    summary='Teacher Dashboard Statistics',
    description='Get overview statistics for teacher dashboard including tests created, groups managed, and recent activity.',
    responses={200: OpenApiTypes.OBJECT}
)
class TeacherDashboardView(APIView):
    permission_classes = [IsAuthenticated]
    # provide a serializer for schema generation
    serializer_class = None  # set below after DummySerializer definition

    def get(self, request):
        if request.user.user_type != 'teacher':
            return Response({'error': 'Only teachers can access this'},
                            status=status.HTTP_403_FORBIDDEN)

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


# ───────────────────────────────────────────────
# 🔹 Teacher Test Management
# ───────────────────────────────────────────────
@extend_schema_view(
    list=extend_schema(summary="List teacher’s tests", tags=["Teacher Tests"]),
    create=extend_schema(summary="Create a new test", tags=["Teacher Tests"]),
    retrieve=extend_schema(summary="Get test by ID", tags=["Teacher Tests"]),
    update=extend_schema(summary="Update a test", tags=["Teacher Tests"]),
    destroy=extend_schema(summary="Delete a test", tags=["Teacher Tests"]),
)
class TeacherTestViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = TestGroup.objects.none()

    def get_queryset(self):
        # Avoid evaluation during schema generation or for anonymous users
        if getattr(self, 'swagger_fake_view', False):
            return self.queryset
        user = getattr(self.request, 'user', None)
        if not user or getattr(user, 'is_anonymous', True):
            return self.queryset
        if getattr(user, 'user_type', None) == 'teacher':
            return TestGroup.objects.filter(created_by=user).order_by('-created_at')
        return self.queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return TestGroupCreateSerializer
        return TestGroupSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        # ✅ Use the normal create logic but override the response
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Save and set created_by manually, since we overrode perform_create
        test_group = serializer.save(created_by=request.user)

        # ✅ Now use the detailed serializer for the response
        detail_serializer = TestGroupDetailSerializer(test_group)
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)


# ───────────────────────────────────────────────
# 🔹 Test Library (read-only)
# ───────────────────────────────────────────────
@extend_schema_view(
    list=extend_schema(summary="List all public tests", tags=["Test Library"]),
    retrieve=extend_schema(summary="Get specific test", tags=["Test Library"]),
)
class TestLibraryViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TestGroupLibrarySerializer

    def get_queryset(self):
        return (
            TestGroup.objects
            .filter(is_active=True)
            .select_related("created_by")
            .prefetch_related("sections", "sections__questions")
            .order_by("-created_at")
        )

    @extend_schema(
        tags=["Test Library"],
        summary="Preview a test (sections only)",
        responses={200: OpenApiTypes.OBJECT},
    )
    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
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


# ───────────────────────────────────────────────
# 🔹 Student Groups
# ───────────────────────────────────────────────
@extend_schema_view(
    list=extend_schema(summary="List student groups", tags=["Student Groups"]),
    create=extend_schema(summary="Create student group", tags=["Student Groups"]),
)
class StudentGroupViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = StudentGroupSerializer
    queryset = StudentGroup.objects.none()

    def get_queryset(self):
        # Avoid evaluation during schema generation or for anonymous users
        if getattr(self, 'swagger_fake_view', False):
            return StudentGroup.objects.none()
        user = getattr(self.request, 'user', None)
        if not user or getattr(user, 'is_anonymous', True):
            return StudentGroup.objects.none()
        if getattr(user, 'user_type', None) == 'teacher':
            return StudentGroup.objects.filter(teacher=user).order_by('-created_at')
        return StudentGroup.objects.none()

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)

    @extend_schema(
        tags=["Student Groups"],
        summary="Add student to group",
        request=AddRemoveStudentSerializer,
        responses={200: OpenApiTypes.OBJECT},
    )
    @action(detail=True, methods=['post'], serializer_class=AddRemoveStudentSerializer)
    def add_student(self, request, pk=None):
        serializer = AddRemoveStudentSerializer(data=request.data)
        if serializer.is_valid():
            student_id = serializer.validated_data['student_id']
            group = self.get_object()
            try:
                student = User.objects.get(id=student_id, user_type='student')
                if student in group.students.all():
                    return Response({'error': 'Student already in group'}, status=400)
                group.students.add(student)
                return Response({'message': f'Student {student.username} added'})
            except User.DoesNotExist:
                return Response({'error': 'Student not found'}, status=404)
        return Response(serializer.errors, status=400)

    @extend_schema(
        tags=["Student Groups"],
        summary="Remove student from group",
        request=AddRemoveStudentSerializer,
        responses={200: OpenApiTypes.OBJECT},
    )
    @action(detail=True, methods=['post'], serializer_class=AddRemoveStudentSerializer)
    def remove_student(self, request, pk=None):
        serializer = AddRemoveStudentSerializer(data=request.data)
        if serializer.is_valid():
            student_id = serializer.validated_data['student_id']
            group = self.get_object()
            try:
                student = User.objects.get(id=student_id, user_type='student')
                if student not in group.students.all():
                    return Response({'error': 'Student not in this group'}, status=400)
                group.students.remove(student)
                return Response({'message': f'Student {student.username} removed'})
            except User.DoesNotExist:
                return Response({'error': 'Student not found'}, status=404)
        return Response(serializer.errors, status=400)


# ───────────────────────────────────────────────
# 🔹 Test Assignments
# ───────────────────────────────────────────────
@extend_schema_view(
    list=extend_schema(summary="List assigned tests", tags=["Test Assignments"]),
    create=extend_schema(summary="Assign new test", tags=["Test Assignments"]),
)
class TestAssignmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TestAssignmentSerializer
    queryset = TestAssignment.objects.none()

    def get_queryset(self):
        # Avoid evaluation during schema generation or for anonymous users
        if getattr(self, 'swagger_fake_view', False):
            return self.queryset
        user = getattr(self.request, 'user', None)
        if not user or getattr(user, 'is_anonymous', True):
            return self.queryset
        if getattr(user, 'user_type', None) == 'teacher':
            return TestAssignment.objects.filter(assigned_by=user).order_by('-assigned_at')
        return self.queryset


# ───────────────────────────────────────────────
# 🔹 Questions
# ───────────────────────────────────────────────
@extend_schema_view(
    list=extend_schema(summary="List all questions", tags=["Questions"]),
    create=extend_schema(summary="Create a new question", tags=["Questions"]),
)
class QuestionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = QuestionSerializer
    queryset = Question.objects.none()

    def get_queryset(self):
        # Avoid evaluation during schema generation or anonymous users
        if getattr(self, 'swagger_fake_view', False):
            return self.queryset
        user = getattr(self.request, 'user', None)
        if not user or getattr(user, 'is_anonymous', True):
            return self.queryset
        if user.user_type == 'teacher':
            return Question.objects.filter(test_group__created_by=self.request.user).order_by('-order')
        return Question.objects.none()

    def create(self, request, *args, **kwargs):
        serializer = QuestionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        question = serializer.save()
        return Response(QuestionSerializer(question).data, status=201)

    @extend_schema(
        tags=["Questions"],
        summary="Upload image for question",
        parameters=[
            OpenApiParameter(name="question_id", location=OpenApiParameter.QUERY, required=True, type=OpenApiTypes.INT),
        ],
        responses={200: OpenApiTypes.OBJECT},
    )
    @action(detail=False, methods=['patch'], url_path='upload-image')
    def upload_image(self, request):
        question_id = request.query_params.get('question_id')
        if not question_id:
            return Response({'error': 'question_id required'}, status=400)
        try:
            question = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            return Response({'error': 'Question not found'}, status=404)
        file = request.FILES.get('image')
        if not file:
            return Response({'error': 'No image provided'}, status=400)
        question.image = file
        question.save()
        return Response({'message': 'Image uploaded', 'image': question.image.url})


# ───────────────────────────────────────────────
# 🔹 Assign Test to Group
# ───────────────────────────────────────────────
@extend_schema(
    tags=["Teacher Assignments"],
    summary="Assign test to a student group",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'test_id': {'type': 'integer', 'example': 5},
                'group_id': {'type': 'integer', 'example': 2},
            },
            'required': ['test_id', 'group_id']
        }
    },
    responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT, 404: OpenApiTypes.OBJECT}
)
class AssignTestToGroupView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.user_type != 'teacher':
            return Response({'error': 'Only teachers can assign tests'}, status=403)
        test_id = request.data.get('test_id')
        group_id = request.data.get('group_id')
        try:
            test_group = TestGroup.objects.get(id=test_id, is_active=True)
            student_group = StudentGroup.objects.get(id=group_id, teacher=request.user)
            if TestAssignment.objects.filter(test_group=test_group, student_group=student_group).exists():
                return Response({'error': 'Already assigned'}, status=400)
            assignment = TestAssignment.objects.create(
                test_group=test_group,
                student_group=student_group,
                assigned_by=request.user
            )
            return Response({
                'message': f'Test "{test_group.title}" assigned to "{student_group.name}"',
                'assignment_id': assignment.id,
                'students_count': student_group.student_count
            })
        except TestGroup.DoesNotExist:
            return Response({'error': 'Test not found'}, status=404)
        except StudentGroup.DoesNotExist:
            return Response({'error': 'Group not found'}, status=404)


# ───────────────────────────────────────────────
# 🔹 Search Students
# ───────────────────────────────────────────────
class DummySerializer(serializers.Serializer):
    """Used for swagger doc on simple GET views."""
    pass


@extend_schema(
    tags=["Teacher Tools"],
    summary="Search students by username or name",
    parameters=[
        OpenApiParameter(name="q", type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, required=False),
    ],
    responses={200: OpenApiTypes.OBJECT},
)
class SearchStudentsView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DummySerializer

    def get(self, request):
        if request.user.user_type != 'teacher':
            return Response({'error': 'Only teachers can search students'}, status=403)
        query = request.query_params.get('q', '')
        students = User.objects.filter(
            user_type='student'
        ).filter(
            Q(username__icontains=query) | Q(first_name__icontains=query) | Q(last_name__icontains=query)
        )[:20]
        return Response([
            {
                'id': s.id,
                'username': s.username,
                'full_name': f"{s.first_name} {s.last_name}".strip() or s.username
            } for s in students
        ])

# Bind DummySerializer for TeacherDashboardView after its definition
TeacherDashboardView.serializer_class = DummySerializer


# ───────────────────────────────────────────────
# 🔹 Teacher Analytics
# ───────────────────────────────────────────────
@extend_schema_view(
    test_analytics=extend_schema(
        tags=["Teacher Analytics"],
        summary="Get analytics for specific test",
        parameters=[
            OpenApiParameter(name="test_id", location=OpenApiParameter.QUERY, required=True, type=OpenApiTypes.INT),
        ],
        responses={200: OpenApiTypes.OBJECT},
    )
)
class TeacherAnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def test_analytics(self, request):
        test_id = request.query_params.get('test_id')
        if not test_id:
            return Response({'error': 'test_id parameter required'}, status=400)
        test = get_object_or_404(TestGroup, id=test_id, created_by=request.user)
        attempts = StudentTestAttempt.objects.filter(test_group=test, status='completed')
        if not attempts.exists():
            return Response({'test_title': test.title, 'analytics': 'No completed attempts yet'})

        stats = attempts.aggregate(avg_score=Avg('percentage'), max_score=Max('percentage'),
                                   min_score=Min('percentage'), avg_total_score=Avg('total_score'))
        pass_rate = (attempts.filter(total_score__gte=test.passing_marks).count() / attempts.count() * 100)
        section_stats = []
        for section in test.sections.all():
            section_attempts = SectionAttempt.objects.filter(
                test_attempt__in=attempts, section=section, status='completed')
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
