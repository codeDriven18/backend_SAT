from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from .models import User, StudentProfile, TeacherProfile
from .serializers import (
    UserRegistrationSerializer, 
    UserLoginSerializer, 
    UserSerializer,
    StudentProfileSerializer,
    TeacherProfileSerializer,
    ProfilePictureUploadSerializer
)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer

    @extend_schema(
        tags=['Authentication'],
        summary='Student Registration',
        description='Register a new student account. Only students can register through this endpoint.',
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'username': {'type': 'string', 'example': 'jane_student'},
                    'email': {'type': 'string', 'example': 'jane@example.com'},
                    'first_name': {'type': 'string', 'example': 'Jane'},
                    'last_name': {'type': 'string', 'example': 'Smith'},
                    'password': {'type': 'string', 'example': 'securepassword123'},
                    'password_confirm': {'type': 'string', 'example': 'securepassword123'},
                    'phone_number': {'type': 'string', 'example': '+1234567890', 'required': False}
                },
                'required': ['username', 'email', 'first_name', 'last_name', 'password', 'password_confirm']
            }
        },
        responses={
            201: {
                'description': 'Registration successful',
                'content': {
                    'application/json': {
                        'example': {
                            'message': 'User created successfully',
                            'access_token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
                            'refresh_token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
                            'user': {
                                'id': 2,
                                'username': 'jane_student',
                                'email': 'jane@example.com',
                                'user_type': 'student'
                            }
                        }
                    }
                }
            },
            400: {
                'description': 'Validation error',
                'content': {
                    'application/json': {
                        'example': {'password': ['Passwords don\'t match']}
                    }
                }
            }
        }
    )
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = (permissions.AllowAny,)
    
    @extend_schema(
        tags=['Authentication'],
        summary='User Login',
        description='Authenticate user and return access/refresh tokens. Students and teachers use the same endpoint but access different frontend apps.',
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'username': {'type': 'string', 'example': 'john_doe'},
                    'password': {'type': 'string', 'example': 'securepassword123'}
                },
                'required': ['username', 'password']
            }
        },
        responses={
            200: {
                'description': 'Login successful',
                'content': {
                    'application/json': {
                        'example': {
                            'access_token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
                            'refresh_token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
                            'user': {
                                'id': 1,
                                'username': 'john_doe',
                                'email': 'john@example.com',
                                'user_type': 'student',
                                'first_name': 'John',
                                'last_name': 'Doe'
                            }
                        }
                    }
                }
            },
            401: {
                'description': 'Invalid credentials',
                'content': {
                    'application/json': {
                        'example': {'error': 'Invalid credentials'}
                    }
                }
            }
        }
    )


    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })

class ProfileView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get(self, request):
        user = request.user
        user_data = self.get_serializer(user).data
        
        if user.user_type == 'student':
            try:
                profile = user.student_profile
                profile_data = StudentProfileSerializer(profile).data
            except StudentProfile.DoesNotExist:
                profile_data = None
        elif user.user_type == 'teacher':
            try:
                profile = user.teacher_profile
                profile_data = TeacherProfileSerializer(profile).data
            except TeacherProfile.DoesNotExist:
                profile_data = None
        else:
            profile_data = None
        
        return Response({
            'user': user_data,
            'profile': profile_data
        })

    def patch(self, request):
        serializer = ProfilePictureUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request.user.profile_picture = serializer.validated_data['profile_picture']
        request.user.save(update_fields=['profile_picture'])
        return Response({'message': 'Profile picture updated', 'user': self.get_serializer(request.user).data})

class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = User.objects.all()
        user_type = self.request.query_params.get('user_type', None)
        if user_type:
            queryset = queryset.filter(user_type=user_type)
        return queryset

class StudentListView(generics.ListAPIView):
    queryset = StudentProfile.objects.all()
    serializer_class = StudentProfileSerializer
    permission_classes = [permissions.IsAuthenticated]