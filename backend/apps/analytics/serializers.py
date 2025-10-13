from rest_framework import serializers

class DashboardStatsSerializer(serializers.Serializer):
    total_tests = serializers.IntegerField()
    avg_score = serializers.FloatField()
    best_score = serializers.FloatField()
    worst_score = serializers.FloatField()
    recent_tests = serializers.ListField()
    performance_chart = serializers.ListField()