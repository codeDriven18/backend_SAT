from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from django.db import transaction
from .models import *
from .serializers import *
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from .serializers import EmptySerializer


class StudentDashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['Student Dashboard'],
        summary='Get Assigned Tests',
        description='Retrieve all tests assigned to the authenticated student through their groups.',
        responses={
            200: {
                'description': 'List of assigned tests with status',
                'content': {
                    'application/json': {
                        'example': [
                            {
                                'id': 1,
                                'title': 'SAT Math Practice Test',
                                'description': 'Comprehensive math practice covering algebra and geometry',
                                'difficulty': 'medium',
                                'total_marks': 800,
                                'created_by': 'teacher_johnson',
                                'sections': [
                                    {
                                        'id': 1,
                                        'name': 'Reading & Writing',
                                        'time_limit': 64,
                                        'question_count': 54
                                    },
                                    {
                                        'id': 2,
                                        'name': 'Math',
                                        'time_limit': 70,
                                        'question_count': 44
                                    }
                                ],
                                'status': 'not_started',
                                'score': None,
                                'percentage': None,
                                'completed_at': None
                            }
                        ]
                    }
                }
            },
            403: {
                'description': 'Only students can access this endpoint',
                'content': {
                    'application/json': {
                        'example': {'error': 'Only students can access this'}
                    }
                }
            }
        }
    )

    
    @action(detail=False, methods=['get'])
    def assigned_tests(self, request):
        """Get all tests assigned to the student"""
        if request.user.user_type != 'student':
            return Response({'error': 'Only students can access this'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        assigned_tests = TestGroup.objects.filter(
            assignments__student_group__students=request.user,
            assignments__is_active=True,
            is_active=True
        ).distinct().prefetch_related('sections', 'attempts')
        
        result = []
        for test in assigned_tests:
            attempt = test.attempts.filter(student=request.user).first()
            
            test_data = {
                'id': test.id,
                'title': test.title,
                'description': test.description,
                'difficulty': test.difficulty,
                'total_marks': test.total_marks,
                'created_by': test.created_by.username,
                'sections': [
                    {
                        'id': section.id,
                        'name': section.name,
                        'time_limit': section.time_limit,
                        'question_count': section.questions.count()
                    }
                    for section in test.sections.all()
                ],
                'status': 'not_started',
                'score': None,
                'percentage': None,
                'completed_at': None
            }
            
            if attempt:
                test_data.update({
                    'status': attempt.status,
                    'score': attempt.total_score,
                    'percentage': attempt.percentage,
                    'completed_at': attempt.completed_at,
                    'current_section_id': attempt.current_section.id if attempt.current_section else None
                })
            
            result.append(test_data)
        
        return Response(result)

class StartTestView(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Student Tests'],
        summary='Start Test Attempt',
        description='Start a new test attempt. Creates a test attempt record and returns the first section to begin.',
        parameters=[
            OpenApiParameter(
                name='test_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID of the test to start'
            )
        ],
        responses={
            200: {
                'description': 'Test started successfully',
                'content': {
                    'application/json': {
                        'example': {
                            'attempt_id': 123,
                            'current_section': {
                                'id': 1,
                                'name': 'Reading & Writing',
                                'time_limit': 64
                            },
                            'sections': [
                                {
                                    'id': 1,
                                    'name': 'Reading & Writing',
                                    'order': 0,
                                    'time_limit': 64
                                },
                                {
                                    'id': 2,
                                    'name': 'Math',
                                    'order': 1,
                                    'time_limit': 70
                                }
                            ]
                        }
                    }
                }
            },
            400: {
                'description': 'Test already completed or other error',
                'content': {
                    'application/json': {
                        'example': {'error': 'Test already completed'}
                    }
                }
            },
            403: {
                'description': 'Test not assigned or permission denied',
                'content': {
                    'application/json': {
                        'example': {'error': 'Test not assigned to you'}
                    }
                }
            }
        }
    )
    def post(self, request, test_id):
        if request.user.user_type != 'student':
            return Response({'error': 'Only students can start tests'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        test = get_object_or_404(TestGroup, id=test_id)
        
        # Check if test is assigned
        if not test.assignments.filter(student_group__students=request.user, is_active=True).exists():
            return Response({'error': 'Test not assigned to you'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Check if already started
        attempt, created = StudentTestAttempt.objects.get_or_create(
            test_group=test,
            student=request.user,
            defaults={
                'total_marks': test.total_marks,
                'status': 'in_progress'
            }
        )
        
        if not created and attempt.status == 'completed':
            return Response({'error': 'Test already completed'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Set current section to first section if not set
        if not attempt.current_section:
            first_section = test.sections.first()
            attempt.current_section = first_section
            attempt.save()
        
        return Response({
            'attempt_id': attempt.id,
            'current_section': {
                'id': attempt.current_section.id,
                'name': attempt.current_section.name,
                'time_limit': attempt.current_section.time_limit
            },
            'sections': [
                {
                    'id': s.id,
                    'name': s.name,
                    'order': s.order,
                    'time_limit': s.time_limit
                }
                for s in test.sections.all()
            ]
        })

class StartSectionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, test_id, section_id):
        test = get_object_or_404(TestGroup, id=test_id)
        section = get_object_or_404(TestSection, id=section_id, test_group=test)
        attempt = get_object_or_404(StudentTestAttempt, test_group=test, student=request.user)
        
        # Create or get section attempt
        section_attempt, created = SectionAttempt.objects.get_or_create(
            test_attempt=attempt,
            section=section,
            defaults={
                'started_at': timezone.now(),
                'status': 'in_progress',
                'total_marks': sum(q.marks for q in section.questions.all())
            }
        )
        
        if not created and section_attempt.status == 'completed':
            return Response({'error': 'Section already completed'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        if created:
            section_attempt.started_at = timezone.now()
            section_attempt.save()
        
        # Update current section in main attempt
        attempt.current_section = section
        attempt.save()
        
        return Response({
            'section_attempt_id': section_attempt.id,
            'started_at': section_attempt.started_at,
            'time_limit': section.time_limit
        })

class GetSectionQuestionsView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['Student Tests'],
        summary='Get Section Questions',
        description='Retrieve all questions for a specific test section. Student answers are included if they exist.',
        parameters=[
            OpenApiParameter(name='test_id', type=OpenApiTypes.INT, location=OpenApiParameter.PATH),
            OpenApiParameter(name='section_id', type=OpenApiTypes.INT, location=OpenApiParameter.PATH)
        ],
        responses={
            200: {
                'description': 'Section questions retrieved successfully',
                'content': {
                    'application/json': {
                        'example': {
                            'section': {
                                'id': 1,
                                'name': 'Reading & Writing',
                                'time_limit': 64,
                                'started_at': '2024-01-15T10:30:00Z'
                            },
                            'questions': [
                                {
                                    'id': 1,
                                    'question_text': 'Which choice completes the text so that it conforms to the conventions of Standard English?',
                                    'passage_text': 'The scientist studied the behavior of dolphins...',
                                    'marks': 1,
                                    'order': 1,
                                    'choices': [
                                        {
                                            'id': 1,
                                            'choice_text': 'whom are known',
                                            'choice_label': 'A'
                                        },
                                        {
                                            'id': 2,
                                            'choice_text': 'which are known',
                                            'choice_label': 'B'
                                        },
                                        {
                                            'id': 3,
                                            'choice_text': 'who are known',
                                            'choice_label': 'C'
                                        },
                                        {
                                            'id': 4,
                                            'choice_text': 'that are known',
                                            'choice_label': 'D'
                                        }
                                    ],
                                    'selected_choice_id': None
                                }
                            ]
                        }
                    }
                }
            }
        }
    )
    
    def get(self, request, test_id, section_id):
        test = get_object_or_404(TestGroup, id=test_id)
        section = get_object_or_404(TestSection, id=section_id, test_group=test)
        attempt = get_object_or_404(StudentTestAttempt, test_group=test, student=request.user)
        section_attempt = get_object_or_404(SectionAttempt, test_attempt=attempt, section=section)
        
        if section_attempt.status not in ['in_progress']:
            return Response({'error': 'Section not active'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        questions = section.questions.prefetch_related('choices').all()
        questions_data = []
        
        for question in questions:
            # Get previous answer if exists
            previous_answer = attempt.answers.filter(question=question).first()
            
            question_data = {
                'id': question.id,
                'question_text': question.question_text,
                'passage_text': question.passage_text,
                'marks': question.marks,
                'order': question.order,
                'choices': [
                    {
                        'id': choice.id,
                        'choice_text': choice.choice_text,
                        'choice_label': choice.choice_label
                    }
                    for choice in question.choices.all()
                ],
                'selected_choice_id': previous_answer.selected_choice.id if previous_answer and previous_answer.selected_choice else None
            }
            questions_data.append(question_data)
        
        return Response({
            'section': {
                'id': section.id,
                'name': section.name,
                'time_limit': section.time_limit,
                'started_at': section_attempt.started_at
            },
            'questions': questions_data
        })

class SubmitAnswerView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, test_id):
        test = get_object_or_404(TestGroup, id=test_id)
        attempt = get_object_or_404(StudentTestAttempt, test_group=test, student=request.user)
        question_id = request.data.get('question_id')
        choice_id = request.data.get('choice_id')
        text_answer = request.data.get('text_answer')

        question = get_object_or_404(Question, id=question_id, section__test_group=test)
        choice = get_object_or_404(Choice, id=choice_id, question=question) if choice_id else None

        section_attempt = get_object_or_404(SectionAttempt, test_attempt=attempt, section=question.section)

        # Save answer
        defaults = {'selected_choice': choice, 'section_attempt': section_attempt}
        if text_answer is not None:
            defaults['text_answer'] = text_answer

        answer, created = StudentAnswer.objects.update_or_create(
            test_attempt=attempt,
            question=question,
            defaults=defaults
        )

        return Response({'message': 'Answer saved successfully'})

class CompleteSectionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, test_id, section_id):
        test = get_object_or_404(TestGroup, id=test_id)
        section = get_object_or_404(TestSection, id=section_id, test_group=test)
        attempt = get_object_or_404(StudentTestAttempt, test_group=test, student=request.user)
        section_attempt = get_object_or_404(SectionAttempt, test_attempt=attempt, section=section)
        
        # Calculate section score
        correct_answers = section_attempt.answers.filter(is_correct=True)
        section_attempt.score = sum(answer.question.marks for answer in correct_answers)
        section_attempt.status = 'completed'
        section_attempt.completed_at = timezone.now()
        
        # Calculate time taken
        if section_attempt.started_at:
            time_taken = (timezone.now() - section_attempt.started_at).total_seconds()
            section_attempt.time_taken = int(time_taken)
        
        section_attempt.save()
        
        # Check if there are more sections
        next_section = test.sections.filter(order__gt=section.order).first()
        if next_section:
            attempt.current_section = next_section
            attempt.save()
            return Response({
                'message': 'Section completed',
                'next_section': {
                    'id': next_section.id,
                    'name': next_section.name,
                    'time_limit': next_section.time_limit
                }
            })
        else:
            return Response({'message': 'Section completed', 'next_section': None})

class CompleteTestView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, test_id):
        test = get_object_or_404(TestGroup, id=test_id)
        attempt = get_object_or_404(StudentTestAttempt, test_group=test, student=request.user)
        
        # Calculate total score from all sections
        total_score = sum(sa.score for sa in attempt.section_attempts.all())
        attempt.total_score = total_score
        attempt.percentage = (total_score / attempt.total_marks * 100) if attempt.total_marks > 0 else 0
        attempt.status = 'completed'
        attempt.completed_at = timezone.now()
        attempt.current_section = None
        attempt.save()
        
        return Response({
            'message': 'Test completed successfully',
            'score': attempt.total_score,
            'total_marks': attempt.total_marks,
            'percentage': attempt.percentage
        })

class TestResultsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, test_id):
        test = get_object_or_404(TestGroup, id=test_id)
        attempt = get_object_or_404(StudentTestAttempt, 
                                   test_group=test, 
                                   student=request.user, 
                                   status='completed')
        
        section_results = []
        for section_attempt in attempt.section_attempts.filter(status='completed'):
            section_results.append({
                'section_name': section_attempt.section.name,
                'score': section_attempt.score,
                'total_marks': section_attempt.total_marks,
                'percentage': (section_attempt.score / section_attempt.total_marks * 100) if section_attempt.total_marks > 0 else 0,
                'time_taken': section_attempt.time_taken
            })
        
        return Response({
            'test_title': test.title,
            'total_score': attempt.total_score,
            'total_marks': attempt.total_marks,
            'percentage': attempt.percentage,
            'completed_at': attempt.completed_at,
            'section_results': section_results,
            'passed': attempt.total_score >= test.passing_marks
        })

class TestReviewView(APIView):
    """Allow students to review their completed test with correct/incorrect answers"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['Student Results'],
        summary='Review Test Answers',
        description='View detailed breakdown of a completed test showing correct/incorrect answers. Only available after test completion.',
        parameters=[
            OpenApiParameter(name='test_id', type=OpenApiTypes.INT, location=OpenApiParameter.PATH)
        ],
        responses={
            200: {
                'description': 'Test review data retrieved successfully',
                'content': {
                    'application/json': {
                        'example': {
                            'test_title': 'SAT Math Practice Test',
                            'total_score': 650,
                            'total_marks': 800,
                            'percentage': 81.25,
                            'sections': [
                                {
                                    'section_name': 'Reading & Writing',
                                    'questions': [
                                        {
                                            'id': 1,
                                            'question_text': 'Which choice completes the text...',
                                            'passage_text': 'The scientist studied...',
                                            'marks': 1,
                                            'choices': [
                                                {
                                                    'id': 1,
                                                    'choice_text': 'whom are known',
                                                    'choice_label': 'A',
                                                    'is_correct': False
                                                },
                                                {
                                                    'id': 2,
                                                    'choice_text': 'which are known',
                                                    'choice_label': 'B',
                                                    'is_correct': True
                                                }
                                            ],
                                            'student_choice_id': 2,
                                            'correct_choice_id': 2,
                                            'is_correct': True,
                                            'marks_earned': 1
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                }
            },
            400: {
                'description': 'Test not completed yet',
                'content': {
                    'application/json': {
                        'example': {'error': 'Test not completed yet'}
                    }
                }
            }
        }
    )
    
    def get(self, request, test_id):
        test = get_object_or_404(TestGroup, id=test_id)
        attempt = get_object_or_404(StudentTestAttempt, 
                                   test_group=test, 
                                   student=request.user, 
                                   status='completed')
        
        review_data = []
        
        for section in test.sections.all():
            section_data = {
                'section_name': section.name,
                'questions': []
            }
            
            for question in section.questions.all():
                student_answer = attempt.answers.filter(question=question).first()
                correct_choice = question.choices.filter(is_correct=True).first()
                
                question_data = {
                    'id': question.id,
                    'question_text': question.question_text,
                    'passage_text': question.passage_text,
                    'marks': question.marks,
                    'choices': [
                        {
                            'id': choice.id,
                            'choice_text': choice.choice_text,
                            'choice_label': choice.choice_label,
                            'is_correct': choice.is_correct
                        }
                        for choice in question.choices.all()
                    ],
                    'student_choice_id': student_answer.selected_choice.id if student_answer and student_answer.selected_choice else None,
                    'correct_choice_id': correct_choice.id if correct_choice else None,
                    'is_correct': student_answer.is_correct if student_answer else False,
                    'marks_earned': question.marks if (student_answer and student_answer.is_correct) else 0
                }
                section_data['questions'].append(question_data)
            
            review_data.append(section_data)
        
        return Response({
            'test_title': test.title,
            'total_score': attempt.total_score,
            'total_marks': attempt.total_marks,
            'percentage': attempt.percentage,
            'sections': review_data
        })

class StudentTestAttemptViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = StudentTestAttemptSerializer
    
    def get_queryset(self):
        if self.request.user.user_type == 'student':
            return StudentTestAttempt.objects.filter(student=self.request.user)
        return StudentTestAttempt.objects.none()

class SubmitBulkAnswersView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
    request=BulkAnswersInputSerializer,
    responses={200: StudentAnswerOutSerializer(many=True)},
    examples=[
        OpenApiExample(
            name="Bulk save answers",
            value={
                "answers": [
                    {"question_id": 1, "choice_id": 3},
                    {"question_id": 2, "choice_id": 7}
                ]
            },
            request_only=True
        ),
        OpenApiExample(
            name="Response",
            value={
                "message": "Answers saved",
                "saved": [
                    {
                        "question": 1,
                        "question_text": "What is 2+2",
                        "selected_choice": 3,
                        "selected_choice_text": "4",
                        "selected_choice_label": "C",
                        "is_correct": True,
                        "answered_at": "2025-09-13T19:05:31.123456Z"
                    }
                ]
            },
            response_only=True
        )
    ]
)


    def post(self, request, test_id, section_id):
        test = get_object_or_404(TestGroup, id=test_id)
        section = get_object_or_404(TestSection, id=section_id, test_group=test)
        attempt = get_object_or_404(StudentTestAttempt, test_group=test, student=request.user)

        # ensure section attempt exists
        section_attempt, _ = SectionAttempt.objects.get_or_create(
            test_attempt=attempt, section=section
        )

        # reject if completed
        if getattr(attempt, 'is_completed', False):
            return Response({'detail': 'Test already completed'}, status=status.HTTP_400_BAD_REQUEST)
        if getattr(section_attempt, 'is_completed', False):
            return Response({'detail': 'Section already completed'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = BulkAnswersInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        items = serializer.validated_data['answers']

        saved = []
        with transaction.atomic():
            # Притащим все вопросы этой секции
            allowed_qs = {q.id: q for q in Question.objects.filter(section=section).prefetch_related('choices')}

            # choices_by_q строим правильно
            choices_by_q = {q.id: {c.id: c for c in q.choices.all()} for q in allowed_qs.values()}

            for item in items:
                qid = item['question_id']
                cid = item.get('choice_id')
                text = item.get('text_answer')

                if qid not in allowed_qs:
                    return Response({'detail': f'question_id {qid} is not in this section'}, status=400)

                question = allowed_qs[qid]
                choice = None
                if cid is not None:
                    if cid not in choices_by_q[qid]:
                        return Response({'detail': f'choice_id {cid} does not belong to question {qid}'}, status=400)
                    choice = choices_by_q[qid][cid]

                defaults = {'selected_choice': choice, 'section_attempt': section_attempt}
                if text is not None:
                    defaults['text_answer'] = text
                ans, _created = StudentAnswer.objects.update_or_create(
                    test_attempt=attempt,
                    question=question,
                    defaults=defaults
                )
                saved.append(ans)

        out = StudentAnswerOutSerializer(saved, many=True).data
        return Response({'message': 'Answers saved', 'saved': out}, status=status.HTTP_200_OK)

class SectionQuestionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, test_id, section_id):
        test = get_object_or_404(TestGroup, id=test_id)
        section = get_object_or_404(TestSection, id=section_id, test_group=test)
        attempt = get_object_or_404(StudentTestAttempt, test_group=test, student=request.user)
        section_attempt, _ = SectionAttempt.objects.get_or_create(test_attempt=attempt, section=section)

        # Чтобы избежать N+1, можно подтянуть choices и ответы:
        questions_qs = section.questions.all().prefetch_related('choices')

        questions_data = QuestionForStudentSerializer(
            questions_qs, many=True, context={'attempt': attempt}
        ).data

        return Response({
            "section": {
                "id": section.id,
                "name": section.name,
                "time_limit": section.time_limit,
                "started_at": section_attempt.started_at,
            },
            "questions": questions_data
        })
        if getattr(self, "swagger_fake_view", False):
            return Model.objects.none()
from drf_spectacular.utils import extend_schema

@extend_schema(
    request=AnswerInputSerializer,
    responses=StudentAnswerOutSerializer
)
class CompleteSectionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, test_id, section_id):
        # your existing logic here
        ...

@extend_schema(
    request=BulkAnswersInputSerializer,
    responses=StudentTestAttemptSerializer
)
class CompleteTestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, test_id):
        # your existing logic here
        ...

@extend_schema(
    responses=StudentTestAttemptSerializer
)
class TestResultsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, test_id):
        # your existing logic here
        ...
