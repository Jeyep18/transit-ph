import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import Admin


JWT_SECRET = settings.SECRET_KEY
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_MINUTES = 60  # BR-ADM-06: tokens expire after 60 minutes


def generate_token(admin: Admin) -> str:
    """Create a JWT for the given admin."""
    payload = {
        'admin_id': admin.id,
        'username': admin.username,
        'exp': datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRATION_MINUTES),
        'iat': datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT. Raises on expiry or invalid signature."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed('Token has expired.')
    except jwt.InvalidTokenError:
        raise AuthenticationFailed('Invalid token.')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check a plain-text password against its bcrypt hash."""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8'),
    )


def hash_password(plain_password: str) -> str:
    """Hash a password with bcrypt."""
    return bcrypt.hashpw(
        plain_password.encode('utf-8'),
        bcrypt.gensalt(),
    ).decode('utf-8')


class JWTAuthentication(BaseAuthentication):
    """
    Custom DRF authentication class.
    Expects header: Authorization: Bearer <token>
    """
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None  # No auth attempted — let other authenticators try

        token = auth_header[7:]
        payload = decode_token(token)

        try:
            admin = Admin.objects.get(id=payload['admin_id'], is_active=True)
        except Admin.DoesNotExist:
            raise AuthenticationFailed('Admin account not found or deactivated.')

        return (admin, token)

    def authenticate_header(self, request):
        return 'Bearer'
