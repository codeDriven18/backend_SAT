from rest_framework import serializers
from .models import Test, Question, Assignment


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ["id", "text", "option1", "option2", "option3", "option4", "correct_option"]


class TestSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Test
        fields = ["id", "title", "description", "questions"]


class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = ["id", "test", "student", "assigned_at", "completed", "score"]
