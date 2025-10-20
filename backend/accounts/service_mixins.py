"""
Service Mixins für Django Views
===============================

Mixins für die Integration der Service-Layer in Django Views.
Bietet saubere Trennung zwischen Views und Business Logic.
"""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import login, logout
from django.utils import timezone
import logging

from .services import (
    ServiceFactory,
    UserService,
    AuthenticationService,
    SessionService,
    EmailService,
    PasskeyService
)

logger = logging.getLogger(__name__)


class ServiceMixin:
    """Base Mixin für Service-Integration"""
    
    def get_user_service(self):
        return ServiceFactory.get_user_service()
    
    def get_auth_service(self):
        return ServiceFactory.get_auth_service()
    
    def get_session_service(self):
        return ServiceFactory.get_session_service()
    
    def get_email_service(self):
        return ServiceFactory.get_email_service()
    
    def get_passkey_service(self):
        return ServiceFactory.get_passkey_service()
    
    def handle_service_error(self, error: Exception, context: str = 'Unknown'):
        """Zentrale Fehlerbehandlung für Views"""
        logger.error(f"View Error in {context}: {str(error)}", exc_info=True)
        
        if isinstance(error, ValidationError):
            return Response(
                {'error': str(error)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(
            {'error': 'Ein unerwarteter Fehler ist aufgetreten.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class AuthenticationServiceMixin(ServiceMixin):
    """Mixin für Authentifizierungs-Views"""
    
    def authenticate_user(self, email: str, password: str):
        """Authentifiziert einen Benutzer über Service"""
        try:
            return self.get_auth_service().authenticate_user(email, password)
        except Exception as e:
            return self.handle_service_error(e, 'authenticate_user')
    
    def create_password_reset_token(self, email: str):
        """Erstellt Passwort-Reset-Token über Service"""
        try:
            token = self.get_auth_service().create_password_reset_token(email)
            if token:
                # Sende E-Mail
                self.get_email_service().send_password_reset_email(email, token)
                return Response(
                    {'message': 'Passwort-Reset-E-Mail wurde gesendet.'},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'error': 'Benutzer mit dieser E-Mail-Adresse nicht gefunden.'},
                    status=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            return self.handle_service_error(e, 'create_password_reset_token')
    
    def reset_password_with_token(self, token: str, new_password: str):
        """Setzt Passwort mit Token zurück über Service"""
        try:
            success = self.get_auth_service().reset_password_with_token(token, new_password)
            if success:
                return Response(
                    {'message': 'Passwort wurde erfolgreich zurückgesetzt.'},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'error': 'Ungültiger oder abgelaufener Token.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return self.handle_service_error(e, 'reset_password_with_token')
    
    def verify_email_with_token(self, token: str):
        """Verifiziert E-Mail mit Token über Service"""
        try:
            success = self.get_auth_service().verify_email_with_token(token)
            if success:
                return Response(
                    {'message': 'E-Mail wurde erfolgreich verifiziert.'},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'error': 'Ungültiger oder abgelaufener Token.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return self.handle_service_error(e, 'verify_email_with_token')


class UserServiceMixin(ServiceMixin):
    """Mixin für Benutzer-Management-Views"""
    
    def create_user_via_service(self, user_data: dict):
        """Erstellt einen Benutzer über Service"""
        try:
            user = self.get_user_service().create_user(user_data)
            
            # Erstelle E-Mail-Verifizierungs-Token
            token = self.get_auth_service().create_email_verification_token(user)
            
            # Sende Verifizierungs-E-Mail
            self.get_email_service().send_email_verification(user, token)
            
            return Response(
                {
                    'message': 'Benutzer wurde erfolgreich erstellt.',
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                    },
                    'email_verification_required': True
                },
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return self.handle_service_error(e, 'create_user_via_service')
    
    def update_user_profile_via_service(self, user, profile_data: dict):
        """Aktualisiert Benutzer-Profil über Service"""
        try:
            updated_user = self.get_user_service().update_user_profile(user, profile_data)
            
            return Response(
                {
                    'message': 'Profil wurde erfolgreich aktualisiert.',
                    'user': {
                        'id': updated_user.id,
                        'email': updated_user.email,
                        'first_name': updated_user.first_name,
                        'last_name': updated_user.last_name,
                        'avatar': updated_user.avatar,
                    }
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return self.handle_service_error(e, 'update_user_profile_via_service')
    
    def change_password_via_service(self, user, current_password: str, new_password: str):
        """Ändert Passwort über Service"""
        try:
            success = self.get_user_service().change_password(user, current_password, new_password)
            if success:
                return Response(
                    {'message': 'Passwort wurde erfolgreich geändert.'},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'error': 'Passwort-Änderung fehlgeschlagen.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return self.handle_service_error(e, 'change_password_via_service')


class SessionServiceMixin(ServiceMixin):
    """Mixin für Session-Management-Views"""
    
    def create_user_session(self, user, request):
        """Erstellt eine Benutzer-Session über Service"""
        try:
            session = self.get_session_service().create_session(user, request)
            return session
        except Exception as e:
            logger.error(f"Failed to create session: {e}")
            return None
    
    def get_user_sessions_via_service(self, user):
        """Ruft Benutzer-Sessions über Service ab"""
        try:
            sessions = self.get_session_service().get_active_sessions(user)
            
            session_data = []
            for session in sessions:
                session_data.append({
                    'id': str(session.id),
                    'ip_address': session.ip_address,
                    'user_agent': session.user_agent,
                    'last_activity': session.last_activity,
                    'created_at': session.created_at,
                    'is_current': session.session_key == self.request.session.session_key
                })
            
            return Response(
                {
                    'sessions': session_data,
                    'total_count': len(session_data)
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return self.handle_service_error(e, 'get_user_sessions_via_service')
    
    def terminate_session_via_service(self, user, session_id: str):
        """Beendet eine Session über Service"""
        try:
            success = self.get_session_service().terminate_session(user, session_id)
            if success:
                return Response(
                    {'message': 'Session wurde erfolgreich beendet.'},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'error': 'Session nicht gefunden.'},
                    status=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            return self.handle_service_error(e, 'terminate_session_via_service')
    
    def terminate_all_sessions_via_service(self, user):
        """Beendet alle Sessions über Service"""
        try:
            count = self.get_session_service().terminate_all_sessions(user)
            return Response(
                {'message': f'{count} Sessions wurden beendet.'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return self.handle_service_error(e, 'terminate_all_sessions_via_service')


class PasskeyServiceMixin(ServiceMixin):
    """Mixin für Passkey-Management-Views"""
    
    def create_passkey_via_service(self, user, credential_data: dict):
        """Erstellt eine Passkey über Service"""
        try:
            credential = self.get_passkey_service().create_passkey_credential(user, credential_data)
            
            return Response(
                {
                    'message': 'Passkey wurde erfolgreich registriert.',
                    'credential_id': credential.id
                },
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return self.handle_service_error(e, 'create_passkey_via_service')
    
    def get_user_passkeys_via_service(self, user):
        """Ruft Benutzer-Passkeys über Service ab"""
        try:
            passkeys = self.get_passkey_service().get_user_passkeys(user)
            
            passkey_data = []
            for passkey in passkeys:
                passkey_data.append({
                    'id': str(passkey.id),
                    'credential_id': passkey.credential_id,
                    'device_type': passkey.device_type,
                    'device_name': passkey.device_name,
                    'created_at': passkey.created_at,
                    'last_used': passkey.last_used,
                })
            
            return Response(
                {
                    'credentials': passkey_data,
                    'total_count': len(passkey_data)
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return self.handle_service_error(e, 'get_user_passkeys_via_service')
    
    def delete_passkey_via_service(self, user, passkey_id: str):
        """Löscht eine Passkey über Service"""
        try:
            success = self.get_passkey_service().delete_passkey(user, passkey_id)
            if success:
                return Response(
                    {'message': 'Passkey wurde erfolgreich gelöscht.'},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'error': 'Passkey nicht gefunden.'},
                    status=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            return self.handle_service_error(e, 'delete_passkey_via_service')


class LoginServiceMixin(AuthenticationServiceMixin, SessionServiceMixin):
    """Kombiniertes Mixin für Login-Operationen"""
    
    def perform_login(self, email: str, password: str, remember_me: bool = False):
        """Führt Login über Services durch"""
        try:
            # Authentifiziere Benutzer
            user = self.get_auth_service().authenticate_user(email, password)
            if not user:
                return Response(
                    {'error': 'Ungültige Anmeldedaten.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Erstelle Session
            session = self.create_user_session(user, self.request)
            
            # Django Login
            login(self.request, user)
            
            # Generiere JWT Tokens (falls verwendet)
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)
            
            return Response(
                {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'role': user.role,
                        'avatar': user.avatar,
                    },
                    'remember_me': remember_me
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return self.handle_service_error(e, 'perform_login')
    
    def perform_logout(self, user):
        """Führt Logout über Services durch"""
        try:
            # Beende aktuelle Session
            self.get_session_service().terminate_session(user, self.request.session.session_key)
            
            # Django Logout
            logout(self.request)
            
            return Response(
                {'message': 'Erfolgreich abgemeldet.'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return self.handle_service_error(e, 'perform_logout')
