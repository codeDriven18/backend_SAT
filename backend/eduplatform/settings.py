import os
from pathlib import Path
from datetime import timedelta
from decouple import config
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-8s2k&y^p#x1r*9u_3l%4kz!q0o^a7b3d')
DEBUG = config('DEBUG', default=False, cast=bool)

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'apps.tests',
    'apps.users',
    'apps.analytics',
    'django_filters',
    'drf_spectacular',
]


LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
    },
    "root": {
        "handlers": ["console"],
        "level": "DEBUG",
    },
}

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    "whitenoise.middleware.WhiteNoiseMiddleware",
]

ROOT_URLCONF = 'eduplatform.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            BASE_DIR / "student-frontend" / "dist",
            BASE_DIR / "teacher-frontend" / "dist"
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'eduplatform.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'postgresql_e4kf',
        'USER': 'feruzbek',
        'PASSWORD': 'qLrAuVedJVtNozZjrTBOgjdMwnnR0cjc',
        'HOST': 'dpg-d30ljq8gjchc73f0h530-a.oregon-postgres.render.com',
        'PORT': '5432',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'

# STATICFILES_DIRS = [BASE_DIR / "student-frontend" / "dist" / "assets"]
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

STATICFILES_DIRS = [
    BASE_DIR / "student-frontend/dist",
    BASE_DIR / "teacher-frontend/dist",
]


STATIC_ROOT = BASE_DIR / "staticfiles"  

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Add this to your REST_FRAMEWORK section
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_SCHEMA_CLASS': 'eduplatform.schema.CustomAutoSchema',
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',  # Only JSON for API
        # 'rest_framework.renderers.BrowsableAPIRenderer',  # optional for dev
    ],
}


SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
}

ALLOWED_HOSTS = [
    'localhost', '127.0.0.1', '0.0.0.0', 'backend-sato.onrender.com'
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    'https://backend-sato.onrender.com',
    'http://backend-sato.onrender.com',
]

CORS_ALLOW_CREDENTIALS = True
AUTH_USER_MODEL = 'users.User'

SPECTACULAR_SETTINGS = {
    'TITLE': 'EduPlatform API',
    'DESCRIPTION': 'Test Management Platform API with separate endpoints for students and teachers',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SORT_OPERATIONS': False,
    'TAGS': [
        {'name': 'Authentication', 'description': 'User authentication and account management'},
        {'name': 'Student Dashboard', 'description': 'Student dashboard and test overview'},
        {'name': 'Student Tests', 'description': 'Test taking functionality for students'},
        {'name': 'Student Results', 'description': 'Test results and review for students'},
        {'name': 'Teacher Dashboard', 'description': 'Teacher dashboard and statistics'},
        {'name': 'Teacher Tests', 'description': 'Test creation and management'},
        {'name': 'Teacher Groups', 'description': 'Student group management'},
        {'name': 'Teacher Assignments', 'description': 'Test assignment to groups'},
        {'name': 'Teacher Analytics', 'description': 'Performance analytics and reporting'},
    ],
}
