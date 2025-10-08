from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListAPIView
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer
    # provide a safe default queryset so schema generator can infer model
    queryset = Notification.objects.none()

    def get_queryset(self):
        # during schema generation self.request may be missing or have AnonymousUser
        if getattr(self, 'swagger_fake_view', False):
            return self.queryset
        user = getattr(self.request, 'user', None)
        if user is None or getattr(user, 'is_anonymous', True):
            return self.queryset
        return Notification.objects.filter(user=user).order_by('-created_at')
