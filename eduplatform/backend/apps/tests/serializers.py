from rest_framework import serializers
from .models import Test, Question, Choice, TestAssignment, TestAttempt, Answer

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'choice_text', 'is_correct']
        extra_kwargs = {'is_correct': {'write_only': True}}

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'question_text', 'question_type', 'marks', 'order', 'choices']

class QuestionCreateSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, required=False)
    
    class Meta:
        model = Question
        fields = ['id', 'question_text', 'question_type', 'marks', 'order', 'choices']
    
    def create(self, validated_data):
        choices_data = validated_data.pop('choices', [])
        question = Question.objects.create(**validated_data)
        
        for choice_data in choices_data:
            Choice.objects.create(question=question, **choice_data)
        
        return question

class TestSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    question_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Test
        fields = ['id', 'title', 'description', 'created_by', 'created_by_name', 
                 'difficulty', 'time_limit', 'total_marks', 'passing_marks', 
                 'is_active', 'created_at', 'questions', 'question_count']

class TestCreateSerializer(serializers.ModelSerializer):
    questions = QuestionCreateSerializer(many=True, required=False)
    
    class Meta:
        model = Test
        fields = ['id', 'title', 'description', 'difficulty', 'time_limit', 
                 'total_marks', 'passing_marks', 'is_active', 'questions']
    
    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        test = Test.objects.create(**validated_data)
        
        for question_data in questions_data:
            choices_data = question_data.pop('choices', [])
            question = Question.objects.create(test=test, **question_data)
            
            for choice_data in choices_data:
                Choice.objects.create(question=question, **choice_data)
        
        return test

class TestAssignmentSerializer(serializers.ModelSerializer):
    test_title = serializers.CharField(source='test.title', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.get_full_name', read_only=True)
    
    class Meta:
        model = TestAssignment
        fields = ['id', 'test', 'test_title', 'assigned_to', 'assigned_to_name', 
                 'assigned_by', 'assigned_by_name', 'assigned_at', 'due_date', 'is_completed']

class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ['id', 'question', 'selected_choice', 'text_answer', 'is_correct']

class TestAttemptSerializer(serializers.ModelSerializer):
    test_title = serializers.CharField(source='assignment.test.title', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    answers = AnswerSerializer(many=True, read_only=True)
    
    class Meta:
        model = TestAttempt
        fields = ['id', 'assignment', 'test_title', 'student', 'student_name', 
                 'started_at', 'completed_at', 'status', 'score', 'total_marks', 
                 'percentage', 'time_taken', 'answers']

class TestAttemptCreateSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True)
    
    class Meta:
        model = TestAttempt
        fields = ['assignment', 'answers']
    
    def create(self, validated_data):
        answers_data = validated_data.pop('answers')
        validated_data['student'] = self.context['request'].user
        attempt = TestAttempt.objects.create(**validated_data)
        
        for answer_data in answers_data:
            answer = Answer.objects.create(attempt=attempt, **answer_data)
            # Check if answer is correct
            if answer.selected_choice and answer.selected_choice.is_correct:
                answer.is_correct = True
                answer.save()
        
        attempt.calculate_score()
        attempt.status = 'completed'
        attempt.save()
        
        # Mark assignment as completed
        attempt.assignment.is_completed = True
        attempt.assignment.save()
        
        return attempt