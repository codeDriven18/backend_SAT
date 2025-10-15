from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import serializers
from .models import Notification
from .serializers import NotificationSerializer
from drf_spectacular.utils import extend_schema


@extend_schema(responses={200: NotificationSerializer(many=True)})
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_list(request):
    notes = Notification.objects.filter(user=request.user).order_by('-created_at')
    serializer = NotificationSerializer(notes, many=True)
    return Response(serializer.data)

# simple placeholder to help schema tools infer output shape
class NotificationListPlaceholder(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    message = serializers.CharField()
    created_at = serializers.DateTimeField()
    is_read = serializers.BooleanField()
