"""
Backend Service Layer
====================

Professionelle Service-Layer für Django Backend.
Trennt Business Logic von Views und bietet bessere Testbarkeit.

Features:
- Service-basierte Architektur
- Business Logic Separation
- Error Handling
- Transaction Management
- Caching
- Logging
"""

import logging
from typing import Optional, Dict, Any, List
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.core.cache import cache
from django.contrib.auth.hashers import make_password, check_password
from django.core.exceptions import ValidationError
from datetime import timedelta
import uuid
import secrets

from .models import (
    User, PasskeyCredential, UserProfile, 
    PasswordResetToken, EmailVerificationToken, UserSession
)
from .serializers import UserSerializer, UserProfileSerializer

logger = logging.getLogger(__name__)
User = get_user_model()


class BaseService:
    """Base Service Class mit gemeinsamen Funktionalitäten"""
    
    @staticmethod
    def log_operation(operation: str, user: Optional[User] = None, **kwargs):
        """Zentrales Logging für Service-Operationen"""
        log_data = {
            'operation': operation,
            'user_id': user.id if user else None,
            'timestamp': timezone.now().isoformat(),
            **kwargs
        }
        logger.info(f"Service Operation: {log_data}")
    
    @staticmethod
    def handle_service_error(error: Exception, context: str):
        """Zentrale Fehlerbehandlung für Services"""
        logger.error(f"Service Error in {context}: {str(error)}", exc_info=True)
        raise error


class UserService(BaseService):
    """Service für Benutzer-Management"""
    
    @classmethod
    def create_user(cls, user_data: Dict[str, Any]) -> User:
        """Erstellt einen neuen Benutzer mit Validierung"""
        try:
            with transaction.atomic():
                # Validiere E-Mail-Eindeutigkeit
                if User.objects.filter(email=user_data['email']).exists():
                    raise ValidationError("E-Mail-Adresse bereits vergeben")
                
                # Erstelle Benutzer
                user = User.objects.create_user(
                    email=user_data['email'],
                    password=user_data['password'],
                    first_name=user_data.get('first_name', ''),
                    last_name=user_data.get('last_name', ''),
                    role=user_data.get('role', 'viewer'),
                    is_active=True
                )
                
                # Erstelle Profil
                UserProfile.objects.create(user=user)
                
                cls.log_operation('user_created', user)
                return user
                
        except Exception as e:
            cls.handle_service_error(e, 'create_user')
    
    @classmethod
    def update_user_profile(cls, user: User, profile_data: Dict[str, Any]) -> User:
        """Aktualisiert Benutzer-Profil mit Validierung"""
        try:
            with transaction.atomic():
                # Aktualisiere Benutzer-Daten
                for field, value in profile_data.items():
                    if hasattr(user, field) and field not in ['id', 'password', 'date_joined']:
                        setattr(user, field, value)
                
                user.save()
                
                # Aktualisiere Profil-Daten
                profile = user.profile
                profile_fields = ['bio', 'location', 'website', 'phone']
                for field in profile_fields:
                    if field in profile_data:
                        setattr(profile, field, profile_data[field])
                
                profile.save()
                
                cls.log_operation('profile_updated', user)
                return user
                
        except Exception as e:
            cls.handle_service_error(e, 'update_user_profile')
    
    @classmethod
    def change_password(cls, user: User, current_password: str, new_password: str) -> bool:
        """Ändert Benutzer-Passwort mit Validierung"""
        try:
            # Validiere aktuelles Passwort
            if not check_password(current_password, user.password):
                raise ValidationError("Aktuelles Passwort ist falsch")
            
            # Validiere neues Passwort
            if len(new_password) < 8:
                raise ValidationError("Neues Passwort muss mindestens 8 Zeichen lang sein")
            
            # Aktualisiere Passwort
            user.password = make_password(new_password)
            user.save()
            
            cls.log_operation('password_changed', user)
            return True
            
        except Exception as e:
            cls.handle_service_error(e, 'change_password')
    
    @classmethod
    def soft_delete_user(cls, user: User, deleted_by: Optional[User] = None) -> bool:
        """Soft-Delete eines Benutzers"""
        try:
            with transaction.atomic():
                user.soft_delete(deleted_by_user=deleted_by)
                cls.log_operation('user_soft_deleted', user, deleted_by_id=deleted_by.id if deleted_by else None)
                return True
                
        except Exception as e:
            cls.handle_service_error(e, 'soft_delete_user')
    
    @classmethod
    def restore_user(cls, user: User) -> bool:
        """Stellt einen gelöschten Benutzer wieder her"""
        try:
            with transaction.atomic():
                user.restore()
                cls.log_operation('user_restored', user)
                return True
                
        except Exception as e:
            cls.handle_service_error(e, 'restore_user')


class AuthenticationService(BaseService):
    """Service für Authentifizierung"""
    
    @classmethod
    def authenticate_user(cls, email: str, password: str) -> Optional[User]:
        """Authentifiziert einen Benutzer"""
        try:
            user = User.objects.filter(email=email, is_active=True, is_deleted=False).first()
            
            if user and user.check_password(password):
                cls.log_operation('user_authenticated', user)
                return user
            
            cls.log_operation('authentication_failed', None, email=email)
            return None
            
        except Exception as e:
            cls.handle_service_error(e, 'authenticate_user')
    
    @classmethod
    def create_password_reset_token(cls, email: str) -> Optional[str]:
        """Erstellt einen Passwort-Reset-Token"""
        try:
            user = User.objects.filter(email=email, is_active=True, is_deleted=False).first()
            if not user:
                return None
            
            # Lösche alte Tokens
            PasswordResetToken.objects.filter(user=user).delete()
            
            # Erstelle neuen Token
            token = secrets.token_urlsafe(32)
            PasswordResetToken.objects.create(
                user=user,
                token=token,
                expires_at=timezone.now() + timedelta(hours=1)
            )
            
            cls.log_operation('password_reset_token_created', user)
            return token
            
        except Exception as e:
            cls.handle_service_error(e, 'create_password_reset_token')
    
    @classmethod
    def reset_password_with_token(cls, token: str, new_password: str) -> bool:
        """Setzt Passwort mit Token zurück"""
        try:
            reset_token = PasswordResetToken.objects.filter(
                token=token,
                expires_at__gt=timezone.now()
            ).first()
            
            if not reset_token:
                raise ValidationError("Ungültiger oder abgelaufener Token")
            
            with transaction.atomic():
                # Aktualisiere Passwort
                reset_token.user.password = make_password(new_password)
                reset_token.user.save()
                
                # Lösche Token
                reset_token.delete()
                
                cls.log_operation('password_reset_completed', reset_token.user)
                return True
                
        except Exception as e:
            cls.handle_service_error(e, 'reset_password_with_token')
    
    @classmethod
    def create_email_verification_token(cls, user: User) -> str:
        """Erstellt einen E-Mail-Verifizierungs-Token"""
        try:
            # Lösche alte Tokens
            EmailVerificationToken.objects.filter(user=user).delete()
            
            # Erstelle neuen Token
            token = secrets.token_urlsafe(32)
            EmailVerificationToken.objects.create(
                user=user,
                token=token,
                expires_at=timezone.now() + timedelta(days=7)
            )
            
            cls.log_operation('email_verification_token_created', user)
            return token
            
        except Exception as e:
            cls.handle_service_error(e, 'create_email_verification_token')
    
    @classmethod
    def verify_email_with_token(cls, token: str) -> bool:
        """Verifiziert E-Mail mit Token"""
        try:
            verification_token = EmailVerificationToken.objects.filter(
                token=token,
                expires_at__gt=timezone.now()
            ).first()
            
            if not verification_token:
                raise ValidationError("Ungültiger oder abgelaufener Token")
            
            with transaction.atomic():
                # Aktualisiere Benutzer-Status
                verification_token.user.is_email_verified = True
                verification_token.user.save()
                
                # Lösche Token
                verification_token.delete()
                
                cls.log_operation('email_verified', verification_token.user)
                return True
                
        except Exception as e:
            cls.handle_service_error(e, 'verify_email_with_token')


class SessionService(BaseService):
    """Service für Session-Management"""
    
    @classmethod
    def create_session(cls, user: User, request) -> UserSession:
        """Erstellt eine neue Session"""
        try:
            session = UserSession.objects.create(
                user=user,
                session_key=request.session.session_key,
                ip_address=cls._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                is_active=True
            )
            
            cls.log_operation('session_created', user, session_id=session.id)
            return session
            
        except Exception as e:
            cls.handle_service_error(e, 'create_session')
    
    @classmethod
    def get_active_sessions(cls, user: User) -> List[UserSession]:
        """Ruft aktive Sessions eines Benutzers ab"""
        try:
            sessions = UserSession.objects.filter(
                user=user,
                is_active=True
            ).order_by('-last_activity')
            
            return list(sessions)
            
        except Exception as e:
            cls.handle_service_error(e, 'get_active_sessions')
    
    @classmethod
    def terminate_session(cls, user: User, session_id: str) -> bool:
        """Beendet eine spezifische Session"""
        try:
            session = UserSession.objects.filter(
                id=session_id,
                user=user
            ).first()
            
            if not session:
                raise ValidationError("Session nicht gefunden")
            
            session.is_active = False
            session.save()
            
            cls.log_operation('session_terminated', user, session_id=session_id)
            return True
            
        except Exception as e:
            cls.handle_service_error(e, 'terminate_session')
    
    @classmethod
    def terminate_all_sessions(cls, user: User) -> int:
        """Beendet alle Sessions eines Benutzers"""
        try:
            count = UserSession.objects.filter(
                user=user,
                is_active=True
            ).update(is_active=False)
            
            cls.log_operation('all_sessions_terminated', user, count=count)
            return count
            
        except Exception as e:
            cls.handle_service_error(e, 'terminate_all_sessions')
    
    @classmethod
    def update_session_activity(cls, session_key: str):
        """Aktualisiert Session-Aktivität"""
        try:
            UserSession.objects.filter(
                session_key=session_key,
                is_active=True
            ).update(last_activity=timezone.now())
            
        except Exception as e:
            logger.warning(f"Failed to update session activity: {e}")
    
    @staticmethod
    def _get_client_ip(request):
        """Extrahiert Client-IP aus Request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class EmailService(BaseService):
    """Service für E-Mail-Operationen"""
    
    @classmethod
    def send_password_reset_email(cls, email: str, token: str) -> bool:
        """Sendet Passwort-Reset-E-Mail"""
        try:
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
            
            send_mail(
                subject='Passwort zurücksetzen - LCREE',
                message=f'''
                Sie haben eine Passwort-Zurücksetzung angefordert.
                
                Klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen:
                {reset_url}
                
                Dieser Link ist 1 Stunde gültig.
                
                Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.
                ''',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            
            cls.log_operation('password_reset_email_sent', None, email=email)
            return True
            
        except Exception as e:
            cls.handle_service_error(e, 'send_password_reset_email')
    
    @classmethod
    def send_email_verification(cls, user: User, token: str) -> bool:
        """Sendet E-Mail-Verifizierung"""
        try:
            verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
            
            send_mail(
                subject='E-Mail verifizieren - LCREE',
                message=f'''
                Hallo {user.first_name},
                
                Willkommen bei LCREE! Bitte verifizieren Sie Ihre E-Mail-Adresse.
                
                Klicken Sie auf den folgenden Link:
                {verification_url}
                
                Dieser Link ist 7 Tage gültig.
                
                Mit freundlichen Grüßen,
                Das LCREE Team
                ''',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            cls.log_operation('email_verification_sent', user)
            return True
            
        except Exception as e:
            cls.handle_service_error(e, 'send_email_verification')


class PasskeyService(BaseService):
    """Service für Passkey-Management"""
    
    @classmethod
    def create_passkey_credential(cls, user: User, credential_data: Dict[str, Any]) -> PasskeyCredential:
        """Erstellt eine neue Passkey-Credential"""
        try:
            credential = PasskeyCredential.objects.create(
                user=user,
                credential_id=credential_data['credential_id'],
                public_key=credential_data['public_key'],
                sign_count=credential_data.get('sign_count', 0),
                device_type=credential_data.get('device_type', 'unknown'),
                device_name=credential_data.get('device_name', 'Unknown Device')
            )
            
            cls.log_operation('passkey_created', user, credential_id=credential.id)
            return credential
            
        except Exception as e:
            cls.handle_service_error(e, 'create_passkey_credential')
    
    @classmethod
    def get_user_passkeys(cls, user: User) -> List[PasskeyCredential]:
        """Ruft Passkeys eines Benutzers ab"""
        try:
            return list(PasskeyCredential.objects.filter(user=user).order_by('-created_at'))
            
        except Exception as e:
            cls.handle_service_error(e, 'get_user_passkeys')
    
    @classmethod
    def delete_passkey(cls, user: User, passkey_id: str) -> bool:
        """Löscht eine Passkey-Credential"""
        try:
            credential = PasskeyCredential.objects.filter(
                id=passkey_id,
                user=user
            ).first()
            
            if not credential:
                raise ValidationError("Passkey nicht gefunden")
            
            credential.delete()
            
            cls.log_operation('passkey_deleted', user, passkey_id=passkey_id)
            return True
            
        except Exception as e:
            cls.handle_service_error(e, 'delete_passkey')


# Service Factory für Dependency Injection
class ServiceFactory:
    """Factory für Service-Instanzen"""
    
    @staticmethod
    def get_user_service() -> UserService:
        return UserService()
    
    @staticmethod
    def get_auth_service() -> AuthenticationService:
        return AuthenticationService()
    
    @staticmethod
    def get_session_service() -> SessionService:
        return SessionService()
    
    @staticmethod
    def get_email_service() -> EmailService:
        return EmailService()
    
    @staticmethod
    def get_passkey_service() -> PasskeyService:
        return PasskeyService()
