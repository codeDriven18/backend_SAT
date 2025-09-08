from drf_spectacular.extensions import OpenApiAuthenticationExtension
from drf_spectacular.openapi import AutoSchema

class JWTAuthenticationExtension(OpenApiAuthenticationExtension):
    target_class = 'rest_framework_simplejwt.authentication.JWTAuthentication'
    name = 'jwtAuth'

    def get_security_definition(self, auto_schema):
        return {
            'type': 'http',
            'scheme': 'bearer',
            'bearerFormat': 'JWT',
            'description': 'Enter your JWT token in the format: Bearer <token>'
        }

class CustomAutoSchema(AutoSchema):
    """Custom schema to organize endpoints better"""
    
    def get_tags(self):
        """Organize endpoints by logical groups"""
        path = self.path
        
        if '/auth/' in path:
            return ['Authentication']
        elif '/student/dashboard/' in path:
            return ['Student Dashboard']
        elif '/student/test/' in path:
            return ['Student Tests']
        elif '/student/' in path and ('results' in path or 'review' in path):
            return ['Student Results']
        elif '/teacher/dashboard/' in path:
            return ['Teacher Dashboard']
        elif '/teacher/tests/' in path or '/teacher/library/' in path:
            return ['Teacher Tests']
        elif '/teacher/groups/' in path:
            return ['Teacher Groups']
        elif '/teacher/assign' in path or '/teacher/assignments/' in path:
            return ['Teacher Assignments']
        elif '/teacher/analytics/' in path:
            return ['Teacher Analytics']
        else:
            return ['Other']