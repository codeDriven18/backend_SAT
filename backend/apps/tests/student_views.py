from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q, F, Sum
from django.db import transaction
from .models import *
from .serializers import *
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
import logging

logger = logging.getLogger(__name__)

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
                                    'question_text': 'Which choice completes the text correctly?',
                                    'passage_text': 'The scientist studied the behavior of dolphins...',
                                    'marks': 1,
                                    'order': 1,
                                    'question_type': 'mcq',
                                    'image': '/media/uploads/questions/sample.jpg',
                                    'choices': [
                                        {'id': 1, 'choice_text': 'whom are known', 'choice_label': 'A'},
                                        {'id': 2, 'choice_text': 'which are known', 'choice_label': 'B'}
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
            return Response({'error': 'Section not active'}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Fetch questions efficiently
        questions = section.questions.prefetch_related('choices').all()

        # ✅ Use serializer (includes image + question_type)
        serializer = QuestionForStudentSerializer(
            questions, many=True, context={'request': request, 'attempt': attempt}
        )

        return Response({
            'section': {
                'id': section.id,
                'name': section.name,
                'time_limit': section.time_limit,
                'started_at': section_attempt.started_at
            },
            'questions': serializer.data
        })


class SubmitAnswerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        test_attempt_id = request.data.get("test_attempt_id")
        question_id = request.data.get("question_id")
        selected_choice_id = request.data.get("selected_choice_id")
        text_answer = request.data.get("text_answer")

        attempt = get_object_or_404(StudentTestAttempt, id=test_attempt_id, student=request.user)
        question = get_object_or_404(Question, id=question_id)

        # ✅ find the right section attempt
        section_attempt = get_object_or_404(
            SectionAttempt,
            test_attempt=attempt,
            section=question.section
        )

        defaults = {}

        if selected_choice_id:
            selected_choice = get_object_or_404(Choice, id=selected_choice_id)
            defaults["selected_choice"] = selected_choice
            defaults["text_answer"] = None  # clear text field if multiple choice
        elif text_answer:
            defaults["text_answer"] = text_answer
            defaults["selected_choice"] = None

        # ✅ include section_attempt (the missing part!)
        defaults["section_attempt"] = section_attempt

        # update or create ensures no duplicate answers for same test_attempt+question
        answer, created = StudentAnswer.objects.update_or_create(
            test_attempt=attempt,
            question=question,
            defaults=defaults
        )

        # correctness auto-calculated inside StudentAnswer.save()

        return Response({
            "message": "Answer submitted successfully",
            "is_correct": answer.is_correct,
            "created": created
        })

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

# class CompleteTestView(APIView):
#     permission_classes = [IsAuthenticated]

#     def post(self, request, test_id):
#         attempt = get_object_or_404(
#             StudentTestAttempt,
#             test_group_id=test_id,
#             student=request.user
#         )

#         # Reuse logic from TestReviewView
#         sections_data = []
#         section_attempts = attempt.section_attempts.all()

#         for section_attempt in section_attempts:
#             answers = StudentAnswer.objects.filter(section_attempt=section_attempt)
#             section_total_marks = 0
#             section_score = 0

#             for ans in answers:
#                 marks_earned = ans.question.marks if ans.is_correct else 0
#                 section_score += marks_earned
#                 section_total_marks += ans.question.marks

#             section_attempt.total_marks = section_total_marks
#             section_attempt.score = section_score
#             section_attempt.status = "completed"
#             section_attempt.completed_at = timezone.now()
#             section_attempt.save()

#             sections_data.append({
#                 "section_id": section_attempt.section.id,
#                 "score": section_score,
#                 "total_marks": section_total_marks,
#             })

#         # Compute totals same as in review
#         total_marks = sum(s["total_marks"] for s in sections_data)
#         total_score = sum(s["score"] for s in sections_data)
#         percentage = round((total_score / total_marks) * 100, 2) if total_marks > 0 else 0

#         # Save to StudentTestAttempt
#         attempt.total_marks = total_marks
#         attempt.total_score = total_score
#         attempt.percentage = percentage
#         attempt.status = "completed"
#         attempt.completed_at = timezone.now()
#         attempt.save()

#         return Response({
#             "message": "Test completed successfully.",
#             "total_score": total_score,
#             "total_marks": total_marks,
#             "percentage": percentage
#         })
class CompleteTestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, test_id):
        attempt = get_object_or_404(
            StudentTestAttempt,
            test_group_id=test_id,
            student=request.user
        )

        logger.info("CompleteTestView called for attempt id=%s, test_id=%s, user=%s",
                    attempt.id, test_id, request.user.username)

        # 1) Inspect StudentAnswer rows for this attempt
        answers_qs = StudentAnswer.objects.filter(test_attempt=attempt).select_related('question')
        answers_count = answers_qs.count()
        logger.info("Found %d StudentAnswer rows for attempt id=%s", answers_count, attempt.id)

        # Print a few rows for debugging
        for a in answers_qs[:50]:
            logger.info("Answer id=%s question=%s is_correct=%s section_attempt=%s text_answer=%r selected_choice=%s",
                        a.id, getattr(a.question, 'id', None), a.is_correct,
                        getattr(a.section_attempt, 'id', None),
                        a.text_answer, getattr(a.selected_choice, 'id', None))

        # 2) If no answers tied to section_attempts, we still compute across all answers
        total_marks = answers_qs.aggregate(total=Sum('question__marks'))['total'] or 0
        total_score = answers_qs.filter(is_correct=True).aggregate(score=Sum(F('question__marks')))['score'] or 0

        # Log aggregated numbers
        logger.info("Aggregated total_marks=%s total_score=%s for attempt id=%s", total_marks, total_score, attempt.id)

        # 3) Fallback: if total_marks == 0 but the review view shows marks, replicate review logic
        if total_marks == 0:
            # attempt.section_attempts may have total_marks from sections
            sa_sum = 0
            ss = attempt.section_attempts.all()
            for s in ss:
                sa_sum += getattr(s, 'total_marks', 0) or 0
            logger.info("Sum of section_attempts.total_marks = %s", sa_sum)
            if sa_sum > 0:
                total_marks = sa_sum

        percentage = round((total_score / total_marks) * 100, 2) if total_marks > 0 else 0.0

        # 4) Persist values
        attempt.total_marks = total_marks
        attempt.total_score = total_score
        attempt.percentage = percentage
        attempt.status = "completed"
        attempt.completed_at = timezone.now()
        attempt.save(update_fields=['total_marks', 'total_score', 'percentage', 'status', 'completed_at'])

        # 5) Optionally update section_attempts (best-effort)
        for section_attempt in attempt.section_attempts.all():
            section_answers = answers_qs.filter(section_attempt=section_attempt)
            if not section_answers.exists():
                # If no answers linked to section_attempt, skip or compute from question->section
                continue
            s_total = section_answers.aggregate(total=Sum('question__marks'))['total'] or 0
            s_score = section_answers.filter(is_correct=True).aggregate(score=Sum(F('question__marks')))['score'] or 0
            section_attempt.total_marks = s_total
            section_attempt.score = s_score
            section_attempt.status = "completed"
            section_attempt.completed_at = timezone.now()
            section_attempt.save(update_fields=['total_marks', 'score', 'status', 'completed_at'])
            logger.info("SectionAttempt %s updated: total=%s score=%s", section_attempt.id, s_total, s_score)

        logger.info("Saved attempt id=%s totals: %s/%s (%s%%)", attempt.id, total_score, total_marks, percentage)
        return Response({
            "message": "Test completed successfully.",
            "total_score": total_score,
            "total_marks": total_marks,
            "percentage": percentage
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
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['Student Tests'],
        summary='Get detailed test review',
        description='Includes all sections, questions, choices, and student answers.',
    )
    def get(self, request, test_id):
        attempt = get_object_or_404(
            StudentTestAttempt,
            test_group_id=test_id,
            student=request.user
        )

        sections_data = []
        for section_attempt in attempt.section_attempts.select_related('section'):
            section = section_attempt.section
            questions_data = []

            for question in section.questions.prefetch_related('choices').all():
                # 🧠 FIX: Fetch student answer from test_attempt, not section_attempt
                student_answer = (
                    attempt.answers.filter(question=question).first()
                )

                # 🧩 Determine correct answers
                correct_choice = question.choices.filter(is_correct=True).first()
                correct_choice_id = correct_choice.id if correct_choice else None
                student_choice_id = (
                    student_answer.selected_choice.id
                    if student_answer and student_answer.selected_choice
                    else None
                )

                # 🎯 Check correctness
                is_correct = student_choice_id == correct_choice_id if student_choice_id else False

                # 🧮 Handle math_free type
                if question.question_type == "math_free":
                    correct_answers = [ans.strip().lower() for ans in (question.correct_answers or [])]
                    student_text = (student_answer.text_answer or "").strip().lower() if student_answer else ""
                    is_correct = student_text in correct_answers
                    correct_choice_id = None
                    student_choice_id = None

                # 🖼 Choices list
                choices_data = [
                    {
                        "id": c.id,
                        "choice_text": c.choice_text,
                        "choice_label": c.choice_label,
                    }
                    for c in question.choices.all()
                ]

                questions_data.append({
                    "id": question.id,
                    "question_text": question.question_text,
                    "passage_text": question.passage_text,
                    "image": request.build_absolute_uri(question.image.url)
                              if question.image else None,
                    "marks": question.marks,
                    "marks_earned": question.marks if is_correct else 0,
                    "question_type": question.question_type,
                    "choices": choices_data,
                    "correct_choice_id": correct_choice_id,
                    "student_choice_id": student_choice_id,
                    "is_correct": is_correct,
                    "correct_answers": question.correct_answers if question.question_type == "math_free" else None,
                    "student_text_answer": student_answer.text_answer if student_answer and question.question_type == "math_free" else None,
                })

            sections_data.append({
                "section_name": section.name,
                "questions": questions_data,
            })

        # 🧾 Compute totals
        total_marks = sum(q["marks"] for s in sections_data for q in s["questions"])
        total_score = sum(q["marks_earned"] for s in sections_data for q in s["questions"])

        return Response({
            "test_title": attempt.test_group.title,
            "total_score": total_score,
            "total_marks": total_marks,
            "percentage": round((total_score / total_marks) * 100, 2) if total_marks > 0 else 0,
            "sections": sections_data,
        })

class StudentTestAttemptViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = StudentTestAttemptSerializer
    
    def get_queryset(self):
        if self.request.user.user_type == 'student':
            return StudentTestAttempt.objects.filter(student=self.request.user).order_by('-started_at')
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
        attempt = get_object_or_404(
            StudentTestAttempt,
            test_group_id=test_id,
            student=request.user
        )
        section_attempt = get_object_or_404(
            SectionAttempt,
            section_id=section_id,
            test_attempt=attempt
        )

        serializer = BulkAnswersInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        answers_data = serializer.validated_data['answers']

        for ans in answers_data:
            question = get_object_or_404(Question, id=ans['question_id'])

            # Handle MCQ
            if question.question_type == 'mcq':
                selected_choice_id = ans.get('choice_id')
                selected_choice = (
                    Choice.objects.filter(id=selected_choice_id, question=question).first()
                    if selected_choice_id else None
                )
                is_correct = selected_choice.is_correct if selected_choice else False

                StudentAnswer.objects.update_or_create(
                    question=question,
                    test_attempt=attempt,
                    defaults={
                        'selected_choice': selected_choice,
                        'is_correct': is_correct,
                    },
                )

            # Handle math_free
            elif question.question_type == 'math_free':
                text_answer = str(ans.get('text_answer', '')).strip()
                correct_answers = [
                    str(a).strip().lower()
                    for a in (question.correct_answers or [])
                ]
                is_correct = text_answer.lower() in correct_answers

                StudentAnswer.objects.update_or_create(
                    question=question,
                    test_attempt=attempt,
                    defaults={
                        'text_answer': text_answer,
                        'is_correct': is_correct,
                    },
                )

        return Response({'message': 'Answers submitted successfully.'}, status=status.HTTP_200_OK)

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
