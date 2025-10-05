from rest_framework import serializers
from drf_spectacular.utils import extend_schema_serializer, OpenApiExample
from .models import *
from apps.users.models import User

class ChoiceSerializer(serializers.ModelSerializer):
    # id = serializers.IntegerField()
    choice_text = serializers.CharField()
    choice_label = serializers.CharField()
    class Meta:
        model = Choice
        fields = ['choice_text', 'choice_label', 'is_correct']

class ChoiceForStudentSerializer(serializers.ModelSerializer):
    """Hides correct answers for students during test"""
    class Meta:
        model = Choice
        fields = ['id', 'choice_text', 'choice_label']

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'text', 'image', 'answer', 'options', 'test_group']


class QuestionForStudentSerializer(serializers.ModelSerializer):
    """Questions for students - no correct answers"""
    choices = ChoiceForStudentSerializer(many=True, read_only=True)
    selected_choice_id = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ['id', 'question_text', 'passage_text', 'marks', 'order', 'choices', 'selected_choice_id']

    def get_selected_choice_id(self, obj):
        attempt = self.context.get('attempt')
        if not attempt:
            return None
        ans = obj.studentanswer_set.filter(test_attempt=attempt).only('selected_choice_id').first()
        return ans.selected_choice_id if ans else None

class QuestionCreateSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, required=False)
    
    class Meta:
        model = Question
        fields = [
            'question_text',
            'passage_text',
            'marks',
            'order',
            'question_type',
            'choices',
            'correct_answers',
            'image',
        ]

    def validate(self, data):
        q_type = data.get('question_type')

        if q_type == 'mcq':
            choices = data.get('choices')
            if not choices or len(choices) != 4:
                raise serializers.ValidationError("MCQ must have exactly 4 choices")
            
            labels = [c.get('choice_label') for c in choices]
            if set(labels) != {'A', 'B', 'C', 'D'}:
                raise serializers.ValidationError("Choices must have labels A, B, C, D")

            correct_count = sum(1 for c in choices if c.get('is_correct'))
            if correct_count != 1:
                raise serializers.ValidationError("MCQ must have exactly one correct answer")

        elif q_type == 'math_free':
            answers = data.get('correct_answers')
            if not answers or not isinstance(answers, list):
                raise serializers.ValidationError("Math free-answer must include a list of correct answers")

        else:
            raise serializers.ValidationError("Invalid question_type")

        return data

class TestSectionSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    question_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TestSection
        fields = ['id', 'name', 'description', 'time_limit', 'order', 'questions', 'question_count']
    
    def get_question_count(self, obj):
        return obj.questions.count()

class TestSectionCreateSerializer(serializers.ModelSerializer):
    questions = QuestionCreateSerializer(many=True)
    
    class Meta:
        model = TestSection
        fields = ['name', 'description', 'time_limit', 'order', 'questions']
    
    def validate_questions(self, value):
        if len(value) < 1:
            raise serializers.ValidationError("Each section must have at least 1 question")
        if len(value) > 30:
            raise serializers.ValidationError("Each section cannot have more than 30 questions")
        return value

class TestGroupSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = TestGroup
        fields = [
            'id',
            'title',
            'description',
            'is_active',
            'is_preview',
            'created_at',
            'questions',
        ]


class TestGroupCreateSerializer(serializers.ModelSerializer):
    sections = TestSectionCreateSerializer(many=True)
    
    class Meta:
        model = TestGroup
        fields = [
            'title', 'description', 'difficulty', 'passing_marks', 
            'is_active', 'is_public', 'sections'
        ]
    
    @extend_schema_serializer(
        examples=[
            OpenApiExample(
                'SAT Practice Test',
                summary='Complete SAT-style test with two sections',
                description='Example of creating a multi-section test similar to SAT format',
                value={
                    'title': 'SAT Practice Test #1',
                    'description': 'Full-length SAT practice test covering Reading & Writing and Math',
                    'difficulty': 'medium',
                    'passing_marks': 400,
                    'is_active': True,
                    'is_public': True,
                    'sections': [
                        {
                            'name': 'Reading & Writing',
                            'description': 'Grammar, vocabulary, and reading comprehension',
                            'time_limit': 64,
                            'order': 0,
                            'questions': [
                                {
                                    'question_text': 'Which choice completes the text so that it conforms to the conventions of Standard English?',
                                    'passage_text': 'The scientist studied the behavior of dolphins _____ are known for their intelligence.',
                                    'marks': 1,
                                    'order': 1,
                                    'choices': [
                                        {
                                            'choice_text': 'whom are known',
                                            'choice_label': 'A',
                                            'is_correct': False
                                        },
                                        {
                                            'choice_text': 'which are known', 
                                            'choice_label': 'B',
                                            'is_correct': True
                                        },
                                        {
                                            'choice_text': 'who are known',
                                            'choice_label': 'C', 
                                            'is_correct': False
                                        },
                                        {
                                            'choice_text': 'that are known',
                                            'choice_label': 'D',
                                            'is_correct': False
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            'name': 'Math',
                            'description': 'Algebra, geometry, and data analysis',
                            'time_limit': 70,
                            'order': 1,
                            'questions': [
                                {
                                    'question_text': 'If 3x + 7 = 22, what is the value of x?',
                                    'passage_text': '',
                                    'marks': 1,
                                    'order': 1,
                                    'choices': [
                                        {
                                            'choice_text': '3',
                                            'choice_label': 'A',
                                            'is_correct': False
                                        },
                                        {
                                            'choice_text': '5',
                                            'choice_label': 'B',
                                            'is_correct': True
                                        },
                                        {
                                            'choice_text': '7',
                                            'choice_label': 'C',
                                            'is_correct': False
                                        },
                                        {
                                            'choice_text': '15',
                                            'choice_label': 'D',
                                            'is_correct': False
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                request_only=True
            )
        ]
    )

    def validate_sections(self, value):
        if len(value) < 1:
            raise serializers.ValidationError("Test must have at least 1 section")
        if len(value) > 5:
            raise serializers.ValidationError("Test cannot have more than 5 sections")
        return value
    
    def create(self, validated_data):
        sections_data = validated_data.pop('sections')
        
        total_marks = 0
        for section_data in sections_data:
            for question_data in section_data['questions']:
                total_marks += question_data.get('marks', 1)
        
        validated_data['total_marks'] = total_marks
        test_group = TestGroup.objects.create(**validated_data)
        
        for section_order, section_data in enumerate(sections_data):
            questions_data = section_data.pop('questions')
            section_data['order'] = section_order
            
            section = TestSection.objects.create(test_group=test_group, **section_data)
            
            for question_order, question_data in enumerate(questions_data):
                choices_data = question_data.pop('choices')
                question_data['order'] = question_order + 1
                
                question = Question.objects.create(section=section, **question_data)
                
                for choice_data in choices_data:
                    Choice.objects.create(question=question, **choice_data)
        
        return test_group

class TestGroupLibrarySerializer(serializers.ModelSerializer):
    """For test library view - basic info only"""
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    section_count = serializers.SerializerMethodField()
    question_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TestGroup
        fields = [
            'id', 'title', 'description', 'created_by_name', 'difficulty',
            'total_marks', 'passing_marks', 'created_at', 'section_count', 'question_count'
        ]
    
    def get_section_count(self, obj):
        return obj.sections.count()
    
    def get_question_count(self, obj):
        return sum(section.questions.count() for section in obj.sections.all())

class StudentBasicSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

class StudentGroupSerializer(serializers.ModelSerializer):
    students = StudentBasicSerializer(many=True, read_only=True)
    teacher_name = serializers.CharField(source='teacher.username', read_only=True)
    student_count = serializers.ReadOnlyField()
    
    class Meta:
        model = StudentGroup
        fields = [
            'id', 'name', 'description', 'teacher_name', 'students', 
            'student_count', 'created_at'
        ]
        read_only_fields = ['teacher_name', 'students', 'student_count', 'created_at']

class TestAssignmentSerializer(serializers.ModelSerializer):
    test_title = serializers.CharField(source='test_group.title', read_only=True)
    group_name = serializers.CharField(source='student_group.name', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.username', read_only=True)
    student_count = serializers.IntegerField(source='student_group.student_count', read_only=True)
    
    class Meta:
        model = TestAssignment
        fields = [
            'id', 'test_group', 'student_group', 'test_title', 'group_name',
            'assigned_by_name', 'student_count', 'assigned_at', 'is_active'
        ]
        read_only_fields = ['assigned_by_name', 'assigned_at']

class SectionAttemptSerializer(serializers.ModelSerializer):
    section_name = serializers.CharField(source='section.name', read_only=True)
    
    class Meta:
        model = SectionAttempt
        fields = [
            'id', 'section', 'section_name', 'started_at', 'completed_at', 
            'time_taken', 'score', 'total_marks', 'status'
        ]

class StudentAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.question_text', read_only=True)
    selected_choice_text = serializers.CharField(source='selected_choice.choice_text', read_only=True)
    selected_choice_label = serializers.CharField(source='selected_choice.choice_label', read_only=True)
    
    class Meta:
        model = StudentAnswer
        fields = [
            'id', 'question', 'question_text', 'selected_choice', 
            'selected_choice_text', 'selected_choice_label', 'is_correct', 'answered_at'
        ]

class StudentTestAttemptSerializer(serializers.ModelSerializer):
    test_title = serializers.CharField(source='test_group.title', read_only=True)
    student_name = serializers.CharField(source='student.username', read_only=True)
    current_section_name = serializers.CharField(source='current_section.name', read_only=True)
    section_attempts = SectionAttemptSerializer(many=True, read_only=True)
    
    class Meta:
        model = StudentTestAttempt
        fields = [
            'id', 'test_group', 'test_title', 'student', 'student_name',
            'started_at', 'completed_at', 'status', 'current_section', 
            'current_section_name', 'total_score', 'total_marks', 'percentage',
            'section_attempts'
        ]

class AddRemoveStudentSerializer(serializers.Serializer):
    student_id = serializers.IntegerField()
    
    def validate_student_id(self, value):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            student = User.objects.get(id=value, user_type='student')
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("Student with this ID does not exist.")


class AnswerInputSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    choice_id = serializers.IntegerField(required=False, allow_null=True)

class BulkAnswersInputSerializer(serializers.Serializer):
    answers = AnswerInputSerializer(many=True)

class StudentAnswerOutSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.question_text', read_only=True)
    selected_choice_text = serializers.CharField(source='selected_choice.choice_text', read_only=True)
    selected_choice_label = serializers.CharField(source='selected_choice.choice_label', read_only=True)

    class Meta:
        model = StudentAnswer
        fields = [
            'question', 'question_text', 'selected_choice', 
            'selected_choice_text', 'selected_choice_label',
            'is_correct', 'answered_at'
        ]