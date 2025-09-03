from rest_framework import serializers
from .models import TestGroup, Question, Choice, StudentTestAttempt, StudentAnswer

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'choice_text', 'choice_label', 'is_correct']
        extra_kwargs = {'is_correct': {'write_only': True}}

class ChoiceForStudentSerializer(serializers.ModelSerializer):
    """Serializer for students - hides correct answers"""
    class Meta:
        model = Choice
        fields = ['id', 'choice_text', 'choice_label']

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'question_text', 'passage_text', 'marks', 'order', 'choices']

class QuestionForStudentSerializer(serializers.ModelSerializer):
    """Serializer for students taking test - hides correct answers"""
    choices = ChoiceForStudentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'question_text', 'passage_text', 'order', 'choices']

class QuestionCreateSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, required=True)
    
    class Meta:
        model = Question
        fields = ['id', 'question_text', 'passage_text', 'marks', 'order', 'choices']
    
    def validate_choices(self, value):
        if len(value) != 4:
            raise serializers.ValidationError("Each question must have exactly 4 choices (A, B, C, D)")
        
        labels = [choice.get('choice_label') for choice in value]
        if set(labels) != {'A', 'B', 'C', 'D'}:
            raise serializers.ValidationError("Choices must have labels A, B, C, D")
        
        correct_count = sum(1 for choice in value if choice.get('is_correct'))
        if correct_count != 1:
            raise serializers.ValidationError("Each question must have exactly one correct answer")
        
        return value
    
    def create(self, validated_data):
        choices_data = validated_data.pop('choices')
        question = Question.objects.create(**validated_data)
        
        for choice_data in choices_data:
            Choice.objects.create(question=question, **choice_data)
        
        return question

class TestGroupSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    question_count = serializers.ReadOnlyField()
    
    class Meta:
        model = TestGroup
        fields = ['id', 'title', 'description', 'test_code', 'created_by', 'created_by_name', 
                 'difficulty', 'time_limit', 'total_marks', 'passing_marks', 
                 'is_active', 'created_at', 'questions', 'question_count']
        read_only_fields = ['test_code', 'created_by']

class TestGroupCreateSerializer(serializers.ModelSerializer):
    questions = QuestionCreateSerializer(many=True, required=True)
    
    class Meta:
        model = TestGroup
        fields = ['id', 'title', 'description', 'difficulty', 'time_limit', 
                 'total_marks', 'passing_marks', 'is_active', 'questions']
    
    def validate_questions(self, value):
        if len(value) < 1:
            raise serializers.ValidationError("Test group must have at least 1 question")
        if len(value) > 60:
            raise serializers.ValidationError("Test group cannot have more than 60 questions")
        return value
    
    def create(self, validated_data):
        questions_data = validated_data.pop('questions')
        
        # Calculate total marks
        total_marks = sum(q.get('marks', 1) for q in questions_data)
        validated_data['total_marks'] = total_marks
        
        test_group = TestGroup.objects.create(**validated_data)
        
        for i, question_data in enumerate(questions_data):
            choices_data = question_data.pop('choices')
            question_data['order'] = i + 1
            question = Question.objects.create(test_group=test_group, **question_data)
            
            for choice_data in choices_data:
                Choice.objects.create(question=question, **choice_data)
        
        return test_group

class TestGroupForStudentSerializer(serializers.ModelSerializer):
    """Serializer for students accessing test by code"""
    questions = QuestionForStudentSerializer(many=True, read_only=True)
    
    class Meta:
        model = TestGroup
        fields = ['id', 'title', 'description', 'time_limit', 'total_marks', 'questions']

class StudentAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAnswer
        fields = ['question', 'selected_choice']

class StudentTestAttemptSerializer(serializers.ModelSerializer):
    test_title = serializers.CharField(source='test_group.title', read_only=True)
    test_code = serializers.CharField(source='test_group.test_code', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    answers = StudentAnswerSerializer(many=True, read_only=True)
    
    class Meta:
        model = StudentTestAttempt
        fields = ['id', 'test_group', 'test_title', 'test_code', 'student', 'student_name', 
                 'started_at', 'completed_at', 'status', 'score', 'total_marks', 
                 'percentage', 'time_taken', 'answers']

class StudentTestAttemptCreateSerializer(serializers.ModelSerializer):
    answers = StudentAnswerSerializer(many=True)
    
    class Meta:
        model = StudentTestAttempt
        fields = ['test_group', 'answers', 'time_taken']
    
    def create(self, validated_data):
        answers_data = validated_data.pop('answers')
        validated_data['student'] = self.context['request'].user
        validated_data['total_marks'] = validated_data['test_group'].total_marks
        
        attempt = StudentTestAttempt.objects.create(**validated_data)
        
        for answer_data in answers_data:
            StudentAnswer.objects.create(attempt=attempt, **answer_data)
        
        attempt.calculate_score()
        attempt.status = 'completed'
        attempt.completed_at = attempt.started_at
        attempt.save()
        
        return attempt

class TestCodeAccessSerializer(serializers.Serializer):
    test_code = serializers.CharField(max_length=6, min_length=6)
    
    def validate_test_code(self, value):
        if not TestGroup.objects.filter(test_code=value, is_active=True).exists():
            raise serializers.ValidationError("Invalid or inactive test code")
        return value