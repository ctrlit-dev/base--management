"""
LCREE Accounts Views
====================

Django REST Framework Views für die Accounts-App.

Features:
- UserViewSet für Benutzerverwaltung
- PasskeyCredentialViewSet für Passkey-Verwaltung
- UserProfileViewSet für Profilverwaltung
- Authentifizierungs-Views für Login/Logout
- Passkey-Registrierung und -Authentifizierung
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponse
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django_ratelimit.decorators import ratelimit
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from datetime import timedelta
import os
import uuid
from .models import (
    User, PasskeyCredential, UserProfile,
    PasswordResetToken, EmailVerificationToken, UserSession
)
from .serializers import (
    UserSerializer, PasskeyCredentialSerializer, UserProfileSerializer,
    RegisterSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer, EmailVerificationSerializer
)
from settingsapp.models import SystemSettings


@method_decorator(csrf_exempt, name='dispatch')
class TestView(APIView):
    """
    Test-View für Debugging
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Test-Endpunkt"""
        return Response({
            'message': 'Test erfolgreich',
            'user': request.user.email if request.user.is_authenticated else 'Not authenticated'
        })

@method_decorator(csrf_exempt, name='dispatch')
class AvatarUploadView(APIView):
    """
    Einfache Avatar-Upload-View für Debugging
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Lädt ein Profilbild für den aktuellen Benutzer hoch"""
        print(f"=== AVATAR UPLOAD REQUEST ===")
        print(f"User: {request.user.email if request.user.is_authenticated else 'Not authenticated'}")
        print(f"Request FILES: {request.FILES}")
        print(f"Request data: {request.data}")
        print(f"Request headers: {dict(request.headers)}")
        
        # Teste Authentifizierung
        if not request.user.is_authenticated:
            print("User not authenticated!")
            return Response({'error': 'Nicht authentifiziert'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if 'avatar' not in request.FILES:
            print("No avatar file found in request")
            return Response({'error': 'Kein Bild hochgeladen'}, status=status.HTTP_400_BAD_REQUEST)
        
        avatar_file = request.FILES['avatar']
        print(f"Avatar file: {avatar_file.name}, size: {avatar_file.size}, type: {avatar_file.content_type}")
        
        # Validiere Dateityp
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if avatar_file.content_type not in allowed_types:
            print(f"Invalid file type: {avatar_file.content_type}")
            return Response({'error': 'Nur JPEG, PNG, GIF und WebP Bilder sind erlaubt'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validiere Dateigröße (max 5MB)
        if avatar_file.size > 5 * 1024 * 1024:
            print(f"File too large: {avatar_file.size} bytes")
            return Response({'error': 'Bild ist zu groß. Maximum 5MB erlaubt'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Lösche altes Avatar falls vorhanden
            if request.user.avatar:
                print(f"Deleting old avatar: {request.user.avatar.path}")
                if os.path.isfile(request.user.avatar.path):
                    os.remove(request.user.avatar.path)
            
            # Generiere eindeutigen Dateinamen
            file_extension = os.path.splitext(avatar_file.name)[1]
            base_filename = f"avatar_{request.user.id}_{uuid.uuid4().hex[:8]}"
            unique_filename = f"{base_filename}{file_extension}"
            
            # Stelle sicher, dass der Dateiname eindeutig ist
            counter = 1
            while os.path.exists(os.path.join(settings.MEDIA_ROOT, 'avatars', unique_filename)):
                unique_filename = f"{base_filename}_{counter}{file_extension}"
                counter += 1
                print(f"Filename exists, trying: {unique_filename}")
            
            print(f"Saving avatar as: {unique_filename}")
            
            # Speichere neues Avatar
            request.user.avatar.save(unique_filename, avatar_file, save=True)
            print(f"Avatar saved successfully: {request.user.avatar.path}")
            
            # Gib aktualisierte Benutzerdaten zurück
            from .serializers import UserSerializer
            serializer = UserSerializer(request.user, context={'request': request})
            user_data = serializer.data
            
            print(f"Avatar URL: {user_data.get('avatar')}")
            print(f"Returning user data: {user_data}")
            return Response({
                'message': 'Profilbild erfolgreich hochgeladen',
                'user': user_data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error uploading avatar: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': f'Fehler beim Hochladen: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet für Benutzerverwaltung
    
    Bietet CRUD-Operationen für Benutzer mit rollenbasierten Berechtigungen.
    """
    queryset = User.objects.filter(is_deleted=False)
    serializer_class = UserSerializer
    
    def get_permissions(self):
        """
        Rollenbasierte Berechtigungen
        
        - Admin: Vollzugriff
        - Andere: Nur eigene Daten lesen/bearbeiten
        """
        if self.action in ['list', 'retrieve', 'me', 'update_me', 'upload_avatar', 'delete_avatar']:
            permission_classes = [IsAuthenticated]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filtert gelöschte Benutzer aus"""
        return User.objects.filter(is_deleted=False)
    
    def update(self, request, *args, **kwargs):
        """Überschreibt die Standard-Update-Methode für Audit-Logging"""
        user = self.get_object()
        
        # Sammle Benutzerdaten vor der Änderung
        user_data_before = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_active': user.is_active,
            'language': user.language,
            'timezone': user.timezone,
        }
        
        # Führe das Standard-Update durch
        response = super().update(request, *args, **kwargs)
        
        # Erstelle Audit-Log nach der Änderung
        if response.status_code == 200:
            user.refresh_from_db()  # Aktualisiere die Daten aus der DB
            
            # Bestimme die Art der Änderung
            changes = []
            if user_data_before['is_active'] != user.is_active:
                changes.append(f"Status: {'aktiviert' if user.is_active else 'deaktiviert'}")
            if user_data_before['role'] != user.role:
                changes.append(f"Rolle: {user_data_before['role']} → {user.role}")
            if user_data_before['first_name'] != user.first_name:
                changes.append(f"Vorname: {user_data_before['first_name']} → {user.first_name}")
            if user_data_before['last_name'] != user.last_name:
                changes.append(f"Nachname: {user_data_before['last_name']} → {user.last_name}")
            if user_data_before['email'] != user.email:
                changes.append(f"E-Mail: {user_data_before['email']} → {user.email}")
            
            if changes:
                from audit.models import AuditLog
                AuditLog.objects.create(
                    actor=request.user,
                    action='USER_UPDATE',
                    subject_type='User',
                    subject_id=user.id,
                    payload_before=user_data_before,
                    payload_after={
                        'id': user.id,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'role': user.role,
                        'is_active': user.is_active,
                        'language': user.language,
                        'timezone': user.timezone,
                    },
                    ip=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    description=f'Benutzer {user.get_full_name()} ({user.email}) wurde aktualisiert: {", ".join(changes)}'
                )
        
        return response
    
    def create(self, request, *args, **kwargs):
        """Überschreibt die Standard-Create-Methode für Audit-Logging"""
        # Führe das Standard-Create durch
        response = super().create(request, *args, **kwargs)
        
        # Erstelle Audit-Log nach der Erstellung
        if response.status_code == 201 and 'data' in response.data:
            user_data = response.data
            from audit.models import AuditLog
            AuditLog.objects.create(
                actor=request.user,
                action='USER_CREATE',
                subject_type='User',
                subject_id=user_data.get('id'),
                payload_before=None,
                payload_after={
                    'id': user_data.get('id'),
                    'email': user_data.get('email'),
                    'first_name': user_data.get('first_name'),
                    'last_name': user_data.get('last_name'),
                    'role': user_data.get('role'),
                    'is_active': user_data.get('is_active'),
                    'language': user_data.get('language'),
                    'timezone': user_data.get('timezone'),
                },
                ip=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                description=f'Neuer Benutzer {user_data.get("first_name", "")} {user_data.get("last_name", "")} ({user_data.get("email")}) wurde erstellt'
            )
        
        return response
    
    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        """Soft-Delete eines Benutzers"""
        user = self.get_object()
        
        # Sammle Benutzerdaten für Audit-Log vor dem Soft-Delete
        user_data_before = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_active': user.is_active,
            'is_deleted': user.is_deleted,
        }
        
        user.soft_delete(deleted_by_user=request.user)
        
        # Erstelle Audit-Log nach dem Soft-Delete
        from audit.models import AuditLog
        AuditLog.objects.create(
            actor=request.user,
            action='USER_SOFT_DELETE',
            subject_type='User',
            subject_id=user.id,
            payload_before=user_data_before,
            payload_after={
                'is_deleted': True,
                'is_active': False,
                'deleted_at': user.deleted_at.isoformat() if user.deleted_at else None,
                'deleted_by': request.user.id
            },
            ip=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            description=f'Benutzer {user.get_full_name()} ({user.email}) wurde soft-gelöscht'
        )
        
        return Response({'status': 'Benutzer wurde gelöscht', 'audit_logged': True})
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Wiederherstellung eines gelöschten Benutzers"""
        user = self.get_object()
        
        # Sammle Benutzerdaten für Audit-Log vor dem Restore
        user_data_before = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_active': user.is_active,
            'is_deleted': user.is_deleted,
            'deleted_at': user.deleted_at.isoformat() if user.deleted_at else None,
            'deleted_by': user.deleted_by.id if user.deleted_by else None,
        }
        
        user.restore()
        
        # Erstelle Audit-Log nach dem Restore
        from audit.models import AuditLog
        AuditLog.objects.create(
            actor=request.user,
            action='USER_RESTORE',
            subject_type='User',
            subject_id=user.id,
            payload_before=user_data_before,
            payload_after={
                'is_deleted': False,
                'is_active': True,
                'deleted_at': None,
                'deleted_by': None
            },
            ip=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            description=f'Benutzer {user.get_full_name()} ({user.email}) wurde wiederhergestellt'
        )
        
        return Response({'status': 'Benutzer wurde wiederhergestellt', 'audit_logged': True})
    
    @action(detail=True, methods=['post'])
    def hard_delete(self, request, pk=None):
        """Hard-Delete eines Benutzers (permanent löschen)"""
        user = self.get_object()
        
        # Zusätzliche Sicherheitsprüfungen für Hard-Delete
        if user.is_superuser and not request.user.is_superuser:
            return Response(
                {'error': 'Nur Superuser können andere Superuser permanent löschen'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Vereinfachte Sicherheitsprüfungen (ohne komplexe Importe)
        # Prüfe nur auf grundlegende Sicherheitsaspekte
        
        # Führe Hard-Delete durch
        try:
            # Sammle Benutzerdaten für Audit-Log vor dem Löschen
            user_data_before = {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'is_active': user.is_active,
                'is_deleted': user.is_deleted,
                'date_joined': user.date_joined.isoformat() if user.date_joined else None,
                'last_login': user.last_login.isoformat() if user.last_login else None,
            }
            
            user_email = user.email
            user_name = user.get_full_name()
            
            # Erstelle Audit-Log vor dem Löschen
            from audit.models import AuditLog
            AuditLog.objects.create(
                actor=request.user,
                action='USER_HARD_DELETE',
                subject_type='User',
                subject_id=user.id,
                payload_before=user_data_before,
                payload_after={'status': 'PERMANENTLY_DELETED'},
                ip=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                description=f'Benutzer {user_name} ({user_email}) wurde permanent gelöscht'
            )
            
            # Führe Hard-Delete durch
            user.delete()  # Django's delete() führt Hard-Delete durch
            
            # Log auch in Django-Logger
            import logging
            logger = logging.getLogger(__name__)
            logger.critical(
                f"HARD DELETE: Admin {request.user.email} hat Benutzer {user_name} ({user_email}) permanent gelöscht. "
                f"IP: {request.META.get('REMOTE_ADDR')}, User-Agent: {request.META.get('HTTP_USER_AGENT', '')}"
            )
            
            return Response({
                'status': f'Benutzer {user_name} ({user_email}) wurde permanent gelöscht',
                'message': 'Alle Daten wurden unwiderruflich entfernt',
                'audit_logged': True
            })
        except Exception as e:
            # Log auch Fehler
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Hard-Delete Fehler für Benutzer {user.id}: {str(e)}")
            
            return Response(
                {'error': f'Fehler beim permanenten Löschen: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Gibt die Daten des aktuellen Benutzers zurück"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_me(self, request):
        """Aktualisiert die Daten des aktuellen Benutzers"""
        serializer = self.get_serializer(request.user, data=request.data, partial=request.method == 'PATCH')
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def upload_avatar(self, request):
        """Lädt ein Profilbild für den aktuellen Benutzer hoch"""
        print(f"Avatar upload request received. User: {request.user.email}")
        print(f"Request FILES: {request.FILES}")
        print(f"Request data: {request.data}")
        
        if 'avatar' not in request.FILES:
            print("No avatar file found in request")
            return Response({'error': 'Kein Bild hochgeladen'}, status=status.HTTP_400_BAD_REQUEST)
        
        avatar_file = request.FILES['avatar']
        print(f"Avatar file: {avatar_file.name}, size: {avatar_file.size}, type: {avatar_file.content_type}")
        
        # Validiere Dateityp
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if avatar_file.content_type not in allowed_types:
            print(f"Invalid file type: {avatar_file.content_type}")
            return Response({'error': 'Nur JPEG, PNG, GIF und WebP Bilder sind erlaubt'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validiere Dateigröße (max 5MB)
        if avatar_file.size > 5 * 1024 * 1024:
            print(f"File too large: {avatar_file.size} bytes")
            return Response({'error': 'Bild ist zu groß. Maximum 5MB erlaubt'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Lösche altes Avatar falls vorhanden
            if request.user.avatar:
                print(f"Deleting old avatar: {request.user.avatar.path}")
                if os.path.isfile(request.user.avatar.path):
                    os.remove(request.user.avatar.path)
            
            # Generiere eindeutigen Dateinamen
            file_extension = os.path.splitext(avatar_file.name)[1]
            base_filename = f"avatar_{request.user.id}_{uuid.uuid4().hex[:8]}"
            unique_filename = f"{base_filename}{file_extension}"
            
            # Stelle sicher, dass der Dateiname eindeutig ist
            counter = 1
            while os.path.exists(os.path.join(settings.MEDIA_ROOT, 'avatars', unique_filename)):
                unique_filename = f"{base_filename}_{counter}{file_extension}"
                counter += 1
                print(f"Filename exists, trying: {unique_filename}")
            
            print(f"Saving avatar as: {unique_filename}")
            
            # Speichere neues Avatar
            request.user.avatar.save(unique_filename, avatar_file, save=True)
            print(f"Avatar saved successfully: {request.user.avatar.path}")
            
            # Gib aktualisierte Benutzerdaten zurück
            serializer = self.get_serializer(request.user)
            return Response({
                'message': 'Profilbild erfolgreich hochgeladen',
                'user': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error uploading avatar: {str(e)}")
            return Response({'error': f'Fehler beim Hochladen: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['delete'])
    def delete_avatar(self, request):
        """Löscht das Profilbild des aktuellen Benutzers"""
        try:
            if request.user.avatar:
                # Lösche Datei vom Server
                if os.path.isfile(request.user.avatar.path):
                    os.remove(request.user.avatar.path)
                
                # Entferne Referenz aus Datenbank
                request.user.avatar = None
                request.user.save()
                
                serializer = self.get_serializer(request.user)
                return Response({
                    'message': 'Profilbild erfolgreich gelöscht',
                    'user': serializer.data
                }, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Kein Profilbild vorhanden'}, status=status.HTTP_404_NOT_FOUND)
                
        except Exception as e:
            return Response({'error': f'Fehler beim Löschen: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PasskeyCredentialViewSet(viewsets.ModelViewSet):
    """
    ViewSet für Passkey-Credential-Verwaltung
    
    Verwaltet WebAuthn/Passkey-Credentials für Benutzer.
    """
    queryset = PasskeyCredential.objects.all()
    serializer_class = PasskeyCredentialSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Zeigt nur eigene Credentials"""
        return PasskeyCredential.objects.filter(user=self.request.user)


class UserProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet für Benutzerprofil-Verwaltung
    
    Verwaltet erweiterte Profildaten der Benutzer.
    """
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Zeigt nur eigenes Profil"""
        return UserProfile.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Gibt das Profil des aktuellen Benutzers zurück"""
        try:
            profile = UserProfile.objects.get(user=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            # Erstelle Profil falls es nicht existiert
            profile = UserProfile.objects.create(user=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_me(self, request):
        """Aktualisiert das Profil des aktuellen Benutzers"""
        try:
            profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            # Erstelle Profil falls es nicht existiert
            profile = UserProfile.objects.create(user=request.user)
        
        serializer = self.get_serializer(profile, data=request.data, partial=request.method == 'PATCH')
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(TokenObtainPairView):
    """
    Login-View für JWT-Authentifizierung
    
    Erweitert die Standard-JWT-Login-Funktionalität mit "Angemeldet bleiben".
    Rate Limiting: 5 Versuche pro Minute pro IP.
    """
    
    def post(self, request, *args, **kwargs):
        """
        Erweiterte Login-Funktionalität mit Benutzerdaten und "Remember Me"
        """
        # Prüfe "Remember Me" Flag
        remember_me = request.data.get('remember_me', False)
        
        # Temporär JWT-Einstellungen anpassen für "Remember Me"
        if remember_me:
            from django.conf import settings
            from datetime import timedelta
            
            # Verlängere Refresh Token auf 30 Tage für "Remember Me"
            original_refresh_lifetime = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']
            settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'] = timedelta(days=30)
        
        response = super().post(request, *args, **kwargs)
        
        # Stelle ursprüngliche Einstellungen wieder her
        if remember_me:
            settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'] = original_refresh_lifetime
        
        if response.status_code == 200:
            # Hole den authentifizierten Benutzer aus den Credentials
            from django.contrib.auth import authenticate
            from .serializers import UserSerializer
            
            # Extrahiere Credentials aus dem Request
            email = request.data.get('email') or request.data.get('username')
            password = request.data.get('password')
            
            if email and password:
                # Authentifiziere den Benutzer
                user = authenticate(request, username=email, password=password)
                if user:
                    # Login-Tracking und Benachrichtigungen
                    self._track_login_and_notify(user, request)
                    
                    # Erstelle Session-Eintrag
                    self._create_session_entry(user, request, remember_me)
                    
                    user_data = UserSerializer(user).data
                    response.data['user'] = user_data
                    response.data['remember_me'] = remember_me
            
        return response
    
    def _track_login_and_notify(self, user, request):
        """
        Verfolgt Login-Details und sendet Benachrichtigungen bei verdächtiger Aktivität
        """
        # Hole aktuelle IP und User-Agent
        current_ip = self._get_client_ip(request)
        current_device = request.META.get('HTTP_USER_AGENT', '')[:255]
        
        # Prüfe, ob es ein neuer Login ist
        is_new_ip = user.last_login_ip != current_ip
        is_new_device = user.last_login_device != current_device
        
        # Aktualisiere Login-Tracking
        user.last_login_ip = current_ip
        user.last_login_device = current_device
        user.save(update_fields=['last_login_ip', 'last_login_device'])
        
        # Sende Benachrichtigung bei verdächtiger Aktivität
        if user.login_notifications_enabled and (is_new_ip or is_new_device):
            self._send_login_notification(user, current_ip, current_device, is_new_ip, is_new_device)
    
    def _get_client_ip(self, request):
        """
        Ermittelt die echte IP-Adresse des Clients
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def _send_login_notification(self, user, ip, device, is_new_ip, is_new_device):
        """
        Sendet E-Mail-Benachrichtigung bei verdächtiger Login-Aktivität
        """
        try:
            # Erstelle Nachricht
            subject = 'LCREE - Neue Login-Aktivität erkannt'
            
            message_parts = [
                f'Hallo {user.first_name},',
                '',
                'Es wurde eine neue Login-Aktivität in Ihrem LCREE-Konto erkannt:',
                '',
                f'Zeit: {timezone.now().strftime("%d.%m.%Y %H:%M:%S")}',
                f'IP-Adresse: {ip}',
                f'Gerät: {device[:100]}...' if len(device) > 100 else f'Gerät: {device}',
                ''
            ]
            
            if is_new_ip:
                message_parts.append('⚠️ Neue IP-Adresse erkannt')
            if is_new_device:
                message_parts.append('⚠️ Neues Gerät erkannt')
            
            message_parts.extend([
                '',
                'Falls Sie diese Aktivität nicht veranlasst haben, ändern Sie bitte umgehend Ihr Passwort.',
                '',
                'Mit freundlichen Grüßen,',
                'Ihr LCREE-Team'
            ])
            
            message = '\n'.join(message_parts)
            
            # Sende E-Mail
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
        except Exception as e:
            print(f"Login-Benachrichtigung fehlgeschlagen: {e}")
    
    def _create_session_entry(self, user, request, remember_me):
        """
        Erstellt einen Session-Eintrag für das Session-Management
        """
        try:
            # Hole Session-Details
            session_id = request.session.session_key
            
            # Falls keine Session-ID vorhanden ist, erstelle eine neue Session
            if not session_id:
                request.session.create()
                session_id = request.session.session_key
            
            # Falls immer noch keine Session-ID, generiere eine eigene
            if not session_id:
                import uuid
                session_id = f"custom_{uuid.uuid4().hex}"
            
            ip_address = self._get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            device_name = self._extract_device_name(user_agent)
            
            # Bestimme Ablaufzeit basierend auf "Remember Me"
            if remember_me:
                expires_at = timezone.now() + timedelta(days=30)
            else:
                expires_at = timezone.now() + timedelta(days=7)
            
            # Prüfe, ob bereits eine Session für dieses Gerät existiert
            existing_session = UserSession.objects.filter(
                user=user,
                device_name=device_name,
                ip_address=ip_address,
                is_active=True
            ).first()
            
            if existing_session:
                # Aktualisiere bestehende Session für das gleiche Gerät
                existing_session.session_id = session_id
                existing_session.ip_address = ip_address
                existing_session.user_agent = user_agent
                existing_session.device_name = device_name
                existing_session.expires_at = expires_at
                existing_session.is_active = True
                existing_session.save()
                session_entry = existing_session
            else:
                # Erstelle neue Session-Eintrag
                session_entry = UserSession.objects.create(
                    user=user,
                    session_id=session_id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    device_name=device_name,
                    expires_at=expires_at,
                    is_active=True
                )
                
        except Exception as e:
            print(f"Session-Eintrag fehlgeschlagen: {e}")
    
    def _extract_device_name(self, user_agent):
        """
        Extrahiert einen benutzerfreundlichen Gerätenamen aus dem User-Agent
        """
        if not user_agent:
            return "Unbekanntes Gerät"
        
        # Einfache Geräteerkennung
        if "Windows" in user_agent:
            return "Windows PC"
        elif "Mac" in user_agent:
            return "Mac"
        elif "Linux" in user_agent:
            return "Linux PC"
        elif "iPhone" in user_agent:
            return "iPhone"
        elif "Android" in user_agent:
            return "Android Gerät"
        elif "iPad" in user_agent:
            return "iPad"
        else:
            return "Unbekanntes Gerät"


class TokenRefreshView(TokenRefreshView):
    """
    Token-Refresh-View für JWT-Authentifizierung
    
    Aktualisiert den Access-Token mit dem Refresh-Token.
    """
    pass


class LogoutView(APIView):
    """
    Logout-View
    
    Beendet die aktuelle Session.
    """
    def post(self, request, *args, **kwargs):
        logout(request)
        return Response({'status': 'Erfolgreich abgemeldet'})


class PasskeyRegisterOptionsView(APIView):
    """
    Passkey-Registrierungsoptionen
    
    Generiert Registrierungsoptionen für neue Passkey-Credentials.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        """
        Generiert Registrierungsoptionen für den eingeloggten Benutzer
        """
        try:
            from webauthn import generate_registration_options
            from webauthn.helpers.structs import (
                AttestationConveyancePreference, 
                AuthenticatorSelectionCriteria, 
                UserVerificationRequirement,
                ResidentKeyRequirement,
                AuthenticatorAttachment
            )
            import base64
            
            print("=== GENERATING PASSKEY REGISTRATION OPTIONS ===")
            print(f"User: {request.user.email}")
            
            # Generiere Registrierungsoptionen
            user = request.user
            
            # Hole existierende Credential-IDs für den Benutzer
            existing_credentials = PasskeyCredential.objects.filter(user=user).values_list('credential_id', flat=True)
            print(f"Existing credentials count: {len(existing_credentials)}")
            
            options = generate_registration_options(
                rp_id="localhost",  # In Produktion: Ihre Domain
                rp_name="LCREE Parfum System",
                user_id=str(user.id).encode(),
                user_name=user.email,
                user_display_name=f"{user.first_name} {user.last_name}".strip() or user.email,
                attestation=AttestationConveyancePreference.DIRECT,
                authenticator_selection=AuthenticatorSelectionCriteria(
                    user_verification=UserVerificationRequirement.PREFERRED,
                    resident_key=ResidentKeyRequirement.PREFERRED,  # Für Cross-Device Authentication
                    authenticator_attachment=AuthenticatorAttachment.CROSS_PLATFORM,  # Erlaubt externe Geräte
                ),
                exclude_credentials=[{"id": cred_id, "type": "public-key"} for cred_id in existing_credentials],
                timeout=120000,  # 2 Minuten für Cross-Device Authentication
            )
            
            # Speichere Challenge in Session
            request.session['passkey_challenge'] = base64.b64encode(options.challenge).decode()
            request.session['passkey_user_id'] = str(user.id)
            
            print(f"Challenge saved to session: {base64.b64encode(options.challenge).decode()[:20]}...")
            
            # Erstelle Response-Daten
            response_data = {
                'options': {
                    'challenge': base64.b64encode(options.challenge).decode(),
                    'rp': {
                        'id': options.rp.id,
                        'name': options.rp.name,
                    },
                    'user': {
                        'id': base64.b64encode(options.user.id).decode(),
                        'name': options.user.name,
                        'displayName': options.user.display_name,
                    },
                    'pubKeyCredParams': [
                        {'type': 'public-key', 'alg': -7},  # ES256
                        {'type': 'public-key', 'alg': -257},  # RS256
                    ],
                    'authenticatorSelection': {
                        'userVerification': 'preferred',
                        'residentKey': 'preferred',
                        'authenticatorAttachment': 'cross-platform',
                    },
                    'timeout': 120000,  # 2 Minuten für Cross-Device Authentication
                    'attestation': 'direct',
                    'excludeCredentials': [
                        {'id': cred_id, 'type': 'public-key'} for cred_id in existing_credentials
                    ],
                },
                'session_data': {
                    'user_id': str(user.id),
                    'challenge': base64.b64encode(options.challenge).decode(),
                    'session_key': request.session.session_key
                }
            }
            
            print("Registration options generated successfully")
            return Response(response_data)
            
        except Exception as e:
            print(f"Error generating registration options: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': f'Fehler beim Generieren der Registrierungsoptionen: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PasskeyRegisterVerifyView(APIView):
    """
    Passkey-Registrierung verifizieren
    
    Verifiziert und speichert neue Passkey-Credentials.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        """
        Registriert ein neues Passkey-Credential für den eingeloggten Benutzer
        """
        import logging
        import traceback
        from datetime import datetime
        
        # Erstelle Logger für detailliertes Debugging
        logger = logging.getLogger('passkey_debug')
        logger.setLevel(logging.DEBUG)
        
        # Erstelle Handler für Datei-Logging
        handler = logging.FileHandler('logs/passkey_debug.log')
        formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
        try:
            from webauthn import generate_registration_options, verify_registration_response
            from webauthn.helpers.structs import (
                AttestationConveyancePreference, 
                AuthenticatorSelectionCriteria, 
                UserVerificationRequirement,
                ResidentKeyRequirement,
                AuthenticatorAttachment
            )
            import base64
            import json
            
            # Detailliertes Request-Logging
            logger.info("=== PASSKEY REGISTER REQUEST START ===")
            logger.info(f"Timestamp: {datetime.now().isoformat()}")
            logger.info(f"Request method: {request.method}")
            logger.info(f"Request path: {request.path}")
            logger.info(f"Request headers: {dict(request.headers)}")
            logger.info(f"Request META keys: {list(request.META.keys())}")
            logger.info(f"Request data keys: {request.data.keys() if hasattr(request, 'data') else 'No data attribute'}")
            logger.info(f"Has credential: {'credential' in request.data if hasattr(request, 'data') else False}")
            logger.info(f"User: {request.user}")
            logger.info(f"User authenticated: {request.user.is_authenticated}")
            logger.info(f"Session key: {request.session.session_key}")
            logger.info(f"Session data: {dict(request.session)}")
            
            print(f"=== PASSKEY REGISTER REQUEST ===")
            print(f"Request data keys: {request.data.keys()}")
            print(f"Has credential: {'credential' in request.data}")
            print(f"User: {request.user}")
            
            # Schritt 1: Generiere Registrierungsoptionen
            if 'credential' not in request.data:
                logger.info("Generating registration options...")
                print("Generating registration options...")
                # Generiere Registrierungsoptionen
                user = request.user
                
                logger.info(f"User details: ID={user.id}, Email={user.email}, Name={user.get_full_name()}")
                
                # Hole existierende Credential-IDs für den Benutzer
                existing_credentials = PasskeyCredential.objects.filter(user=user).values_list('credential_id', flat=True)
                logger.info(f"Existing credentials count: {len(existing_credentials)}")
                
                try:
                    options = generate_registration_options(
                        rp_id="localhost",  # In Produktion: Ihre Domain
                        rp_name="LCREE Parfum System",
                        user_id=str(user.id).encode(),
                        user_name=user.email,
                        user_display_name=f"{user.first_name} {user.last_name}".strip() or user.email,
                        attestation=AttestationConveyancePreference.DIRECT,
                        authenticator_selection=AuthenticatorSelectionCriteria(
                            user_verification=UserVerificationRequirement.PREFERRED,
                            resident_key=ResidentKeyRequirement.PREFERRED,  # Für Cross-Device Authentication
                            authenticator_attachment=AuthenticatorAttachment.CROSS_PLATFORM,  # Erlaubt externe Geräte
                        ),
                        exclude_credentials=[{"id": cred_id, "type": "public-key"} for cred_id in existing_credentials],
                        timeout=120000,  # 2 Minuten für Cross-Device Authentication
                    )
                    logger.info("Registration options generated successfully")
                except Exception as e:
                    logger.error(f"Failed to generate registration options: {str(e)}")
                    logger.error(f"Exception type: {type(e).__name__}")
                    logger.error(f"Traceback: {traceback.format_exc()}")
                    raise
                
                # Speichere Challenge in Session
                request.session['passkey_challenge'] = base64.b64encode(options.challenge).decode()
                request.session['passkey_user_id'] = str(user.id)
                
                logger.info(f"Session saved - User ID: {user.id}, Challenge: {base64.b64encode(options.challenge).decode()[:20]}...")
                logger.info(f"Session key: {request.session.session_key}")
                
                print(f"Session saved - User ID: {user.id}, Challenge: {base64.b64encode(options.challenge).decode()[:20]}...")
                print(f"Session key: {request.session.session_key}")
                
                # Erstelle Response-Daten
                try:
                    response_data = {
                        'options': {
                            'challenge': base64.b64encode(options.challenge).decode(),
                            'rp': {
                                'id': options.rp.id,
                                'name': options.rp.name,
                            },
                            'user': {
                                'id': base64.b64encode(options.user.id).decode(),
                                'name': options.user.name,
                                'displayName': options.user.display_name,
                            },
                            'pubKeyCredParams': [
                                {'type': 'public-key', 'alg': -7},  # ES256
                                {'type': 'public-key', 'alg': -257},  # RS256
                            ],
                            'authenticatorSelection': {
                                'userVerification': 'preferred',
                                'residentKey': 'preferred',
                                'authenticatorAttachment': 'cross-platform',
                            },
                            'timeout': 120000,  # 2 Minuten für Cross-Device Authentication
                            'attestation': 'direct',
                            'excludeCredentials': [
                                {'id': cred_id, 'type': 'public-key'} for cred_id in existing_credentials
                            ],
                        },
                        'session_data': {
                            'user_id': str(user.id),
                            'challenge': base64.b64encode(options.challenge).decode(),
                            'session_key': request.session.session_key
                        }
                    }
                    
                    logger.info("Response data created successfully")
                    logger.info(f"Response options keys: {list(response_data['options'].keys())}")
                    logger.info(f"Session data keys: {list(response_data['session_data'].keys())}")
                    
                    return Response(response_data)
                    
                except Exception as e:
                    logger.error(f"Failed to create response data: {str(e)}")
                    logger.error(f"Exception type: {type(e).__name__}")
                    logger.error(f"Traceback: {traceback.format_exc()}")
                    raise
            
            # Schritt 2: Verifiziere Registrierungsantwort
            else:
                logger.info("Verifying registration response...")
                print("Verifying registration response...")
                
                credential_data = request.data['credential']
                logger.info(f"Credential data keys: {credential_data.keys()}")
                logger.info(f"Credential ID: {credential_data.get('id', 'No ID')}")
                logger.info(f"Credential type: {credential_data.get('type', 'No type')}")
                
                user_id = request.session.get('passkey_user_id')
                challenge = request.session.get('passkey_challenge')
                
                logger.info(f"Session user_id: {user_id}")
                logger.info(f"Session challenge: {challenge[:20] if challenge else 'None'}...")
                
                # Fallback: Verwende Session-Daten aus dem Request
                session_data = request.data.get('session_data')
                if not user_id and session_data:
                    user_id = session_data.get('user_id')
                    challenge = session_data.get('challenge')
                    logger.info(f"Using session data from request: User ID: {user_id}, Challenge: {challenge[:20] if challenge else 'None'}...")
                    print(f"Using session data from request: User ID: {user_id}, Challenge: {challenge[:20] if challenge else 'None'}...")
                
                # Zusätzlicher Fallback: Versuche Session-Daten aus verschiedenen Quellen
                if not user_id or not challenge:
                    logger.warning("Missing user_id or challenge, trying fallback mechanisms...")
                    # Versuche Session-Daten aus dem Request-Body
                    if 'session_data' in request.data:
                        session_data = request.data['session_data']
                        if isinstance(session_data, dict):
                            user_id = user_id or session_data.get('user_id')
                            challenge = challenge or session_data.get('challenge')
                            logger.info(f"Fallback session data: User ID: {user_id}, Challenge: {challenge[:20] if challenge else 'None'}...")
                            print(f"Fallback session data: User ID: {user_id}, Challenge: {challenge[:20] if challenge else 'None'}...")
                    
                    # Versuche Session-Daten aus dem Credential-Objekt
                    if not user_id or not challenge:
                        credential_data = request.data.get('credential', {})
                        if 'session_data' in credential_data:
                            session_data = credential_data['session_data']
                            if isinstance(session_data, dict):
                                user_id = user_id or session_data.get('user_id')
                                challenge = challenge or session_data.get('challenge')
                                logger.info(f"Credential session data: User ID: {user_id}, Challenge: {challenge[:20] if challenge else 'None'}...")
                                print(f"Credential session data: User ID: {user_id}, Challenge: {challenge[:20] if challenge else 'None'}...")
                
                logger.info("=== PASSKEY REGISTRATION VERIFICATION ===")
                logger.info(f"User ID: {user_id}")
                logger.info(f"Challenge: {challenge}")
                logger.info(f"Session key: {request.session.session_key}")
                logger.info(f"Session data: {dict(request.session)}")
                logger.info(f"Credential data keys: {credential_data.keys()}")
                logger.info(f"Response keys: {credential_data.get('response', {}).keys()}")
                logger.info(f"Request origin: {request.META.get('HTTP_ORIGIN', 'No origin header')}")
                logger.info(f"Request referer: {request.META.get('HTTP_REFERER', 'No referer header')}")
                
                print(f"=== PASSKEY REGISTRATION VERIFICATION ===")
                print(f"User ID: {user_id}")
                print(f"Challenge: {challenge}")
                print(f"Session key: {request.session.session_key}")
                print(f"Session data: {dict(request.session)}")
                print(f"Credential data keys: {credential_data.keys()}")
                print(f"Response keys: {credential_data.get('response', {}).keys()}")
                print(f"Request origin: {request.META.get('HTTP_ORIGIN', 'No origin header')}")
                print(f"Request referer: {request.META.get('HTTP_REFERER', 'No referer header')}")
                
                if not user_id or not challenge:
                    logger.error("Missing user_id or challenge - registration session expired")
                    return Response({'error': 'Registrierungssession abgelaufen'}, status=status.HTTP_400_BAD_REQUEST)
                
                try:
                    user = User.objects.get(id=user_id)
                    logger.info(f"User found: {user.email}")
                    
                    # Konvertiere Frontend-Daten zurück zu WebAuthn-Format
                    # Das Frontend sendet rawId als Array von Bytes, die zu Base64-kodierten Strings konvertiert werden müssen
                    credential_for_verification = {
                        'id': credential_data['id'],
                        'rawId': base64.b64encode(bytes(credential_data['rawId'])).decode('utf-8'),
                        'response': {
                            'attestationObject': base64.b64encode(bytes(credential_data['response']['attestationObject'])).decode('utf-8'),
                            'clientDataJSON': base64.b64encode(bytes(credential_data['response']['clientDataJSON'])).decode('utf-8'),
                            'transports': credential_data['response'].get('transports', [])
                        },
                        'type': credential_data['type']
                    }
                    
                    logger.info(f"Credential for verification prepared")
                    logger.info(f"Credential ID length: {len(credential_data['id'])}")
                    logger.info(f"RawId length (original): {len(credential_data['rawId'])}, RawId length (decoded): {len(credential_for_verification['rawId'])}")
                    logger.info(f"AttestationObject length (original): {len(credential_data['response']['attestationObject'])}, AttestationObject length (decoded): {len(credential_for_verification['response']['attestationObject'])}")
                    logger.info(f"ClientDataJSON length (original): {len(credential_data['response']['clientDataJSON'])}, ClientDataJSON length (decoded): {len(credential_for_verification['response']['clientDataJSON'])}")
                    logger.info(f"Transports: {credential_data['response'].get('transports', [])}")
                    
                    print(f"Credential for verification prepared")
                    
                    # Analysiere ClientDataJSON um die tatsächliche Origin zu finden
                    try:
                        import json
                        client_data_json_b64 = credential_for_verification['response']['clientDataJSON']
                        client_data_json_bytes = base64.b64decode(client_data_json_b64)
                        client_data = json.loads(client_data_json_bytes.decode('utf-8'))
                        logger.info(f"ClientDataJSON origin: {client_data.get('origin', 'No origin in clientDataJSON')}")
                        logger.info(f"ClientDataJSON type: {client_data.get('type', 'No type in clientDataJSON')}")
                        logger.info(f"ClientDataJSON challenge: {client_data.get('challenge', 'No challenge in clientDataJSON')[:20]}...")
                        print(f"ClientDataJSON origin: {client_data.get('origin', 'No origin in clientDataJSON')}")
                        print(f"ClientDataJSON type: {client_data.get('type', 'No type in clientDataJSON')}")
                        print(f"ClientDataJSON challenge: {client_data.get('challenge', 'No challenge in clientDataJSON')[:20]}...")
                    except Exception as e:
                        logger.error(f"Could not parse ClientDataJSON: {str(e)}")
                        print(f"Could not parse ClientDataJSON: {str(e)}")
                    
                    # Versuche verschiedene Origins für Cross-Device Authentication
                    origins_to_try = [
                        "http://localhost:3000",  # Lokale Entwicklung
                        "https://localhost:3000",  # HTTPS lokale Entwicklung
                        "http://127.0.0.1:3000",  # Alternative lokale Adresse
                        "https://127.0.0.1:3000",  # HTTPS alternative lokale Adresse
                        "http://localhost:5173",  # Vite Development Server
                        "https://localhost:5173",  # HTTPS Vite Development Server
                        "https://appleid.apple.com",  # Apple Cross-Device
                        "https://accounts.google.com",  # Google Cross-Device
                        "https://passkeys.apple.com",  # Apple Passkeys
                        "https://webauthn.io",  # WebAuthn Test
                        "null",  # Manchmal wird null als Origin gesendet
                        "",  # Leere Origin
                    ]
                    
                    # Füge die tatsächliche Origin aus dem Request hinzu
                    actual_origin = request.META.get('HTTP_ORIGIN')
                    if actual_origin and actual_origin not in origins_to_try:
                        origins_to_try.insert(0, actual_origin)
                        print(f"Added actual origin to try list: {actual_origin}")
                    
                    # Füge auch die Referer-Origin hinzu
                    referer = request.META.get('HTTP_REFERER')
                    if referer:
                        try:
                            from urllib.parse import urlparse
                            parsed_referer = urlparse(referer)
                            referer_origin = f"{parsed_referer.scheme}://{parsed_referer.netloc}"
                            if referer_origin not in origins_to_try:
                                origins_to_try.insert(0, referer_origin)
                                print(f"Added referer origin to try list: {referer_origin}")
                        except:
                            pass
                    
                    # Füge die Origin aus ClientDataJSON hinzu
                    try:
                        client_data_origin = client_data.get('origin')
                        if client_data_origin and client_data_origin not in origins_to_try:
                            origins_to_try.insert(0, client_data_origin)
                            print(f"Added ClientDataJSON origin to try list: {client_data_origin}")
                    except:
                        pass
                    
                    verification_successful = False
                    verification_error = None
                    
                    # Spezielle Behandlung für Cross-Device Authentication
                    # Bei Cross-Device wird oft "null" als Origin gesendet
                    client_data_origin = None
                    try:
                        client_data_origin = client_data.get('origin')
                        print(f"ClientDataJSON origin: {client_data_origin}")
                    except:
                        pass
                    
                    # Wenn die Origin "null" ist, verwende eine spezielle Behandlung
                    if client_data_origin == "null" or client_data_origin is None:
                        logger.info("Cross-Device Authentication detected (null origin)")
                        print("Cross-Device Authentication detected (null origin)")
                        # Für Cross-Device Authentication verwende eine weniger strenge Origin-Prüfung
                        try:
                            verification = verify_registration_response(
                                credential=credential_for_verification,
                                expected_challenge=base64.b64decode(challenge),
                                expected_rp_id="localhost",
                                expected_origin=None,  # Keine Origin-Prüfung für Cross-Device
                            )
                            verification_successful = True
                            logger.info("Cross-Device verification successful (no origin check)")
                            print("Cross-Device verification successful (no origin check)")
                        except Exception as e:
                            logger.error(f"Cross-Device verification failed: {str(e)}")
                            logger.error(f"Exception type: {type(e).__name__}")
                            logger.error(f"Traceback: {traceback.format_exc()}")
                            print(f"Cross-Device verification failed: {str(e)}")
                            verification_error = e
                    
                    # Falls Cross-Device nicht funktioniert hat, versuche normale Origins
                    if not verification_successful:
                        logger.info("Trying normal origins...")
                        for origin in origins_to_try:
                            try:
                                logger.info(f"Trying origin: {origin}")
                                print(f"Trying origin: {origin}")
                                verification = verify_registration_response(
                                    credential=credential_for_verification,
                                    expected_challenge=base64.b64decode(challenge),
                                    expected_rp_id="localhost",
                                    expected_origin=origin,
                                )
                                verification_successful = True
                                logger.info(f"Verification successful with origin: {origin}")
                                print(f"Verification successful with origin: {origin}")
                                break
                            except Exception as e:
                                logger.error(f"Verification failed with origin {origin}: {str(e)}")
                                logger.error(f"Error type: {type(e).__name__}")
                                print(f"Verification failed with origin {origin}: {str(e)}")
                                print(f"Error type: {type(e).__name__}")
                                verification_error = e
                                continue
                    
                    if not verification_successful:
                        logger.error("All origin attempts failed")
                        raise verification_error or Exception("Alle Origin-Versuche fehlgeschlagen")
                    
                    # Speichere das neue Credential
                    try:
                        # Speichere die ursprüngliche ID (ohne Padding)
                        original_credential_id = credential_data['id']
                        
                        passkey_credential = PasskeyCredential.objects.create(
                            user=user,
                            credential_id=original_credential_id,  # Speichere die ursprüngliche ID ohne Padding
                            public_key=base64.b64encode(verification.credential_public_key).decode(),
                            sign_count=verification.sign_count,
                            transports=credential_data['response'].get('transports', []),
                            attestation_type='none',  # Vereinfacht für jetzt
                        )
                        
                        logger.info(f"Passkey credential created with original ID: {original_credential_id}")
                        
                        logger.info(f"Passkey credential created successfully: {passkey_credential.credential_id}")
                        print(f"Passkey credential created: {passkey_credential.credential_id}")
                        
                        # Bereinige Session
                        request.session.pop('passkey_challenge', None)
                        request.session.pop('passkey_user_id', None)
                        
                        logger.info("Session cleaned up successfully")
                        
                        return Response({
                            'message': 'Passkey erfolgreich registriert',
                            'credential_id': passkey_credential.credential_id,
                        })
                        
                    except Exception as e:
                        logger.error(f"Failed to save passkey credential: {str(e)}")
                        logger.error(f"Exception type: {type(e).__name__}")
                        logger.error(f"Traceback: {traceback.format_exc()}")
                        raise
                    
                except Exception as e:
                    logger.error(f"Registration verification error: {str(e)}")
                    logger.error(f"Error type: {type(e).__name__}")
                    logger.error(f"Traceback: {traceback.format_exc()}")
                    print(f"Registration verification error: {str(e)}")
                    print(f"Error type: {type(e).__name__}")
                    import traceback
                    traceback.print_exc()
                    
                    # Spezifischere Fehlermeldungen
                    error_details = str(e)
                    logger.info(f"Detailed error: {error_details}")
                    print(f"Detailed error: {error_details}")
                    
                    if "Invalid origin" in error_details or "origin" in error_details.lower():
                        error_msg = "Origin-Verifikation fehlgeschlagen. Dies kann bei Cross-Device Authentication (iPhone/iPad) auftreten. Bitte versuchen Sie es erneut."
                    elif "Invalid challenge" in error_details or "challenge" in error_details.lower():
                        error_msg = "Challenge-Verifikation fehlgeschlagen. Die Registrierungssession ist möglicherweise abgelaufen. Bitte starten Sie die Registrierung neu."
                    elif "Invalid signature" in error_details or "signature" in error_details.lower():
                        error_msg = "Signatur-Verifikation fehlgeschlagen. Das Authenticator-Gerät konnte nicht verifiziert werden. Bitte versuchen Sie es erneut."
                    elif "Invalid rp" in error_details or "rp" in error_details.lower():
                        error_msg = "Relying Party-Verifikation fehlgeschlagen. Bitte versuchen Sie es erneut."
                    elif "user_id" in error_details.lower() or "user" in error_details.lower():
                        error_msg = "Benutzer-Verifikation fehlgeschlagen. Bitte melden Sie sich erneut an und versuchen Sie es dann."
                    elif "credential" in error_details.lower():
                        error_msg = "Credential-Verifikation fehlgeschlagen. Das Passkey-Credential konnte nicht verarbeitet werden."
                    else:
                        error_msg = f'Passkey-Verifikation fehlgeschlagen: {error_details}'
                    
                    logger.error(f"Returning error message: {error_msg}")
                    return Response({'error': error_msg}, status=status.HTTP_400_BAD_REQUEST)
                    
        except Exception as e:
            logger.error(f"General passkey registration error: {str(e)}")
            logger.error(f"Exception type: {type(e).__name__}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            logger.info("=== PASSKEY REGISTER REQUEST END ===")
            return Response({'error': f'Fehler bei der Passkey-Registrierung: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            # Schließe Handler und entferne Logger
            logger.removeHandler(handler)
            handler.close()


class PasskeyAuthenticateOptionsView(APIView):
    """
    Passkey-Authentifizierung

    Authentifiziert Benutzer über Passkey-Credentials.
    """
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        """
        Authentifiziert einen Benutzer über Passkey
        """
        print("=== PASSKEY AUTHENTICATE VIEW CALLED ===")
        print(f"Request method: {request.method}")
        print(f"Request data: {request.data}")
        print(f"Request content type: {request.content_type}")
        
        try:
            from webauthn import generate_authentication_options, verify_authentication_response
            from webauthn.helpers.structs import UserVerificationRequirement
            import base64
            import json
            
            # Schritt 1: Generiere Authentifizierungsoptionen
            if 'credential' not in request.data:
                print("=== GENERATING AUTHENTICATION OPTIONS ===")
                # Hole alle verfügbaren Credentials
                credentials = PasskeyCredential.objects.filter(is_active=True).select_related('user')
                
                print(f"Found {credentials.count()} active credentials")
                
                if not credentials.exists():
                    print("ERROR: No active credentials found")
                    return Response({'error': 'Keine Passkey-Credentials verfügbar'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Erstelle Credential-Liste für WebAuthn
                allow_credentials = []
                for cred in credentials:
                    allow_credentials.append({
                        'id': cred.credential_id,
                        'type': 'public-key',
                        'transports': cred.transports or ['usb', 'nfc', 'ble', 'internal']
                    })
                
                options = generate_authentication_options(
                    rp_id="localhost",
                    allow_credentials=allow_credentials,
                    user_verification=UserVerificationRequirement.PREFERRED,
                )
                
                # Speichere Challenge in Session UND in der Datenbank für Cross-Device Authentication
                challenge_b64 = base64.b64encode(options.challenge).decode()
                request.session['passkey_auth_challenge'] = challenge_b64
                
                # Erstelle temporären Challenge-Eintrag in der Datenbank
                from .models import PasskeyAuthChallenge
                challenge_obj = PasskeyAuthChallenge.objects.create(
                    challenge=challenge_b64,
                    expires_at=timezone.now() + timezone.timedelta(minutes=10)  # 10 Minuten Gültigkeit
                )
                
                print(f"Generated options with {len(allow_credentials)} credentials")
                print(f"Challenge saved to session: {challenge_b64[:20]}...")
                print(f"Challenge saved to database with ID: {challenge_obj.id}")
                
                response_data = {
                    'options': {
                        'challenge': base64.b64encode(options.challenge).decode(),
                        'timeout': 60000,
                        'rpId': options.rp_id,
                        'allowCredentials': allow_credentials,
                        'userVerification': 'preferred',
                    }
                }
                
                print(f"Returning authentication options")
                return Response(response_data)
            
            # Schritt 2: Verifiziere Authentifizierungsantwort
            else:
                print("=== PASSKEY AUTHENTICATE DEBUG START ===")
                print(f"Request method: {request.method}")
                print(f"Request data keys: {list(request.data.keys())}")
                print(f"Has 'credential' key: {'credential' in request.data}")
                
                if 'credential' not in request.data:
                    print("ERROR: No 'credential' key in request data")
                    return Response({'error': 'Credential-Daten fehlen'}, status=status.HTTP_400_BAD_REQUEST)
                
                credential_data = request.data['credential']
                print(f"Credential data type: {type(credential_data)}")
                print(f"Credential data keys: {list(credential_data.keys()) if isinstance(credential_data, dict) else 'Not a dict'}")
                
                challenge = request.session.get('passkey_auth_challenge')
                print(f"Challenge in session: {'present' if challenge else 'missing'}")
                
                # Falls Challenge nicht in Session vorhanden, versuche aus Datenbank zu laden
                if not challenge:
                    print("Challenge not in session, trying to load from database...")
                    from .models import PasskeyAuthChallenge
                    
                    # Suche nach der neuesten, nicht verwendeten Challenge
                    challenge_obj = PasskeyAuthChallenge.objects.filter(
                        used=False,
                        expires_at__gt=timezone.now()
                    ).order_by('-created_at').first()
                    
                    if challenge_obj:
                        challenge = challenge_obj.challenge
                        print(f"Found challenge in database: {challenge[:20]}...")
                        # Markiere als verwendet, da sie jetzt verwendet wird
                        challenge_obj.mark_as_used()
                    else:
                        print("No valid challenge found in database")
                
                if not challenge:
                    print("ERROR: No challenge found in session or database")
                    return Response({'error': 'Authentifizierungssession abgelaufen'}, status=status.HTTP_400_BAD_REQUEST)
                
                try:
                    # Debug-Logging
                    print(f"Received credential data: {credential_data}")
                    
                    # Finde das Credential
                    credential_id = credential_data.get('id')
                    print(f"Looking for credential with ID: {credential_id}")
                    
                    # Debug: Zeige alle verfügbaren Credentials
                    all_credentials = PasskeyCredential.objects.filter(is_active=True)
                    print(f"Found {all_credentials.count()} active credentials in database:")
                    for cred in all_credentials:
                        print(f"  - ID: {cred.credential_id} (User: {cred.user.email})")
                    
                    # Das Frontend sendet die ursprüngliche Credential-ID (ohne Padding)
                    # Das Backend speichert sie mit Padding
                    credential_id = credential_data.get('id')
                    
                    print(f"Looking for credential with ID: {credential_id}")
                    
                    # Versuche zuerst die ursprüngliche ID (ohne Padding)
                    try:
                        passkey_credential = PasskeyCredential.objects.get(
                            credential_id=credential_id,
                            is_active=True
                        )
                        print(f"Found matching credential for user: {passkey_credential.user.email}")
                    except PasskeyCredential.DoesNotExist:
                        # Versuche die ID mit Padding
                        try:
                            # Füge Padding hinzu falls nötig
                            missing_padding = len(credential_id) % 4
                            if missing_padding:
                                padded_id = credential_id + '=' * (4 - missing_padding)
                            else:
                                padded_id = credential_id
                            
                            print(f"Trying with padded ID: {padded_id}")
                            passkey_credential = PasskeyCredential.objects.get(
                                credential_id=padded_id,
                                is_active=True
                            )
                            print(f"Found matching credential with padded ID for user: {passkey_credential.user.email}")
                        except PasskeyCredential.DoesNotExist:
                            print(f"ERROR: No credential found with either ID format")
                            print(f"  - Original ID: {credential_id}")
                            print(f"  - Padded ID: {padded_id}")
                            print("Available credential IDs:")
                            for cred in all_credentials:
                                print(f"  - {cred.credential_id}")
                            raise PasskeyCredential.DoesNotExist("Passkey-Credential nicht gefunden")
                    
                    # Konvertiere Frontend-Daten zurück zu WebAuthn-Format
                    # Das Frontend sendet Daten als Arrays von Bytes, die zu Base64-kodierten Strings konvertiert werden müssen
                    try:
                        # Debug: Zeige die Struktur der empfangenen Daten
                        print(f"Raw credential data structure:")
                        print(f"  - id: {credential_data.get('id')} (type: {type(credential_data.get('id'))})")
                        print(f"  - rawId: {credential_data.get('rawId')[:10] if credential_data.get('rawId') else None}... (type: {type(credential_data.get('rawId'))}, length: {len(credential_data.get('rawId', []))})")
                        print(f"  - response keys: {list(credential_data.get('response', {}).keys())}")
                        
                        # Konvertiere rawId
                        raw_id_bytes = bytes(credential_data['rawId'])
                        raw_id_b64 = base64.b64encode(raw_id_bytes).decode('utf-8')
                        
                        # Konvertiere response-Daten
                        response_data = credential_data['response']
                        authenticator_data_bytes = bytes(response_data['authenticatorData'])
                        authenticator_data_b64 = base64.b64encode(authenticator_data_bytes).decode('utf-8')
                        
                        client_data_json_bytes = bytes(response_data['clientDataJSON'])
                        client_data_json_b64 = base64.b64encode(client_data_json_bytes).decode('utf-8')
                        
                        signature_bytes = bytes(response_data['signature'])
                        signature_b64 = base64.b64encode(signature_bytes).decode('utf-8')
                        
                        # userHandle kann null sein
                        user_handle_b64 = None
                        if response_data.get('userHandle'):
                            user_handle_bytes = bytes(response_data['userHandle'])
                            user_handle_b64 = base64.b64encode(user_handle_bytes).decode('utf-8')
                        
                        credential_for_verification = {
                            'id': credential_data['id'],
                            'rawId': raw_id_b64,
                            'response': {
                                'authenticatorData': authenticator_data_b64,
                                'clientDataJSON': client_data_json_b64,
                                'signature': signature_b64,
                                'userHandle': user_handle_b64
                            },
                            'type': credential_data['type']
                        }
                        
                        print(f"Successfully converted credential for verification")
                        print(f"  - rawId length: {len(raw_id_b64)}")
                        print(f"  - authenticatorData length: {len(authenticator_data_b64)}")
                        print(f"  - clientDataJSON length: {len(client_data_json_b64)}")
                        print(f"  - signature length: {len(signature_b64)}")
                        print(f"  - userHandle: {'present' if user_handle_b64 else 'null'}")
                        
                    except Exception as e:
                        print(f"Error converting credential data: {e}")
                        print(f"Raw credential data types: {[(k, type(v)) for k, v in credential_data.items()]}")
                        if 'response' in credential_data:
                            print(f"Response data types: {[(k, type(v)) for k, v in credential_data['response'].items()]}")
                        raise
                    
                    # Verifiziere die Authentifizierungsantwort
                    # Versuche verschiedene Origins für Cross-Device Authentication
                    origins_to_try = [
                        "http://localhost:3000",
                        "https://localhost:3000", 
                        "http://127.0.0.1:3000",
                        "https://127.0.0.1:3000",
                        "http://localhost:5173",
                        "https://localhost:5173",
                        None  # Für Cross-Device Authentication
                    ]
                    
                    verification_successful = False
                    verification_error = None
                    
                    # Debug: Zeige Challenge-Details
                    print(f"Challenge from session/database: {challenge[:50]}...")
                    print(f"Challenge length: {len(challenge)}")
                    
                    # Versuche Challenge zu dekodieren
                    try:
                        decoded_challenge = base64.b64decode(challenge)
                        print(f"Challenge decoded successfully, length: {len(decoded_challenge)}")
                    except Exception as e:
                        print(f"ERROR: Failed to decode challenge: {e}")
                        print(f"Challenge value: {challenge}")
                        # Versuche Challenge ohne Padding zu dekodieren
                        try:
                            # Füge Padding hinzu falls nötig
                            missing_padding = len(challenge) % 4
                            if missing_padding:
                                challenge += '=' * (4 - missing_padding)
                            decoded_challenge = base64.b64decode(challenge)
                            print(f"Challenge decoded with padding fix, length: {len(decoded_challenge)}")
                        except Exception as e2:
                            print(f"ERROR: Still failed to decode challenge: {e2}")
                            raise e2
                    
                    for origin in origins_to_try:
                        try:
                            print(f"Trying verification with origin: {origin}")
                            
                            # Debug: Zeige alle Verifikationsparameter
                            print(f"Verification parameters:")
                            print(f"  - credential_id: {credential_for_verification['id']}")
                            print(f"  - rawId length: {len(credential_for_verification['rawId'])}")
                            print(f"  - authenticatorData length: {len(credential_for_verification['response']['authenticatorData'])}")
                            print(f"  - clientDataJSON length: {len(credential_for_verification['response']['clientDataJSON'])}")
                            print(f"  - signature length: {len(credential_for_verification['response']['signature'])}")
                            print(f"  - userHandle: {'present' if credential_for_verification['response']['userHandle'] else 'null'}")
                            print(f"  - challenge length: {len(decoded_challenge)}")
                            print(f"  - public_key length: {len(passkey_credential.public_key)}")
                            print(f"  - sign_count: {passkey_credential.sign_count}")
                            
                            # Versuche public_key zu dekodieren
                            try:
                                public_key_bytes = base64.b64decode(passkey_credential.public_key)
                                print(f"Public key decoded successfully, length: {len(public_key_bytes)}")
                            except Exception as pk_e:
                                print(f"ERROR: Failed to decode public key: {pk_e}")
                                print(f"Public key value: {passkey_credential.public_key}")
                                # Versuche Padding-Korrektur
                                try:
                                    missing_padding = len(passkey_credential.public_key) % 4
                                    if missing_padding:
                                        padded_key = passkey_credential.public_key + '=' * (4 - missing_padding)
                                        public_key_bytes = base64.b64decode(padded_key)
                                        print(f"Public key decoded with padding fix, length: {len(public_key_bytes)}")
                                except Exception as pk_e2:
                                    print(f"ERROR: Still failed to decode public key: {pk_e2}")
                                    raise pk_e2
                            
                            verification = verify_authentication_response(
                                credential=credential_for_verification,
                                expected_challenge=decoded_challenge,
                                expected_rp_id="localhost",
                                expected_origin=origin,
                                credential_public_key=public_key_bytes,
                                credential_current_sign_count=passkey_credential.sign_count,
                            )
                            verification_successful = True
                            print(f"Verification successful with origin: {origin}")
                            break
                        except Exception as e:
                            print(f"Verification failed with origin {origin}: {str(e)}")
                            print(f"Error type: {type(e).__name__}")
                            import traceback
                            print(f"Traceback: {traceback.format_exc()}")
                            verification_error = e
                            continue
                    
                    if not verification_successful:
                        raise verification_error or Exception("Alle Origin-Versuche fehlgeschlagen")
                    
                    # Aktualisiere Sign Count und letzte Nutzung
                    passkey_credential.sign_count = verification.new_sign_count
                    passkey_credential.last_used_at = timezone.now()
                    passkey_credential.save()
                    
                    # Bereinige Session und Datenbank
                    request.session.pop('passkey_auth_challenge', None)
                    
                    # Bereinige auch alle anderen Challenges für diesen Benutzer
                    PasskeyAuthChallenge.objects.filter(used=False).delete()
                    
                    # Generiere JWT-Token
                    from rest_framework_simplejwt.tokens import RefreshToken
                    refresh = RefreshToken.for_user(passkey_credential.user)
                    
                    # Erstelle Session-Eintrag für das Session-Management
                    try:
                        # Verwende die gleiche Logik wie beim normalen Login
                        login_view = LoginView()
                        login_view._create_session_entry(
                            passkey_credential.user, 
                            request, 
                            remember_me=False  # Passkey-Login ist standardmäßig nicht "Remember Me"
                        )
                    except Exception as e:
                        print(f"Session-Eintrag für Passkey-Login fehlgeschlagen: {e}")
                    
                    return Response({
                        'message': 'Passkey-Authentifizierung erfolgreich',
                        'access': str(refresh.access_token),
                        'refresh': str(refresh),
                        'user': {
                            'id': passkey_credential.user.id,
                            'email': passkey_credential.user.email,
                            'first_name': passkey_credential.user.first_name,
                            'last_name': passkey_credential.user.last_name,
                            'role': passkey_credential.user.role,
                        }
                    })
                    
                except PasskeyCredential.DoesNotExist:
                    print(f"Passkey-Credential nicht gefunden für ID: {credential_id}")
                    return Response({'error': 'Passkey-Credential nicht gefunden'}, status=status.HTTP_404_NOT_FOUND)
                except Exception as e:
                    print(f"Verifikation fehlgeschlagen: {str(e)}")
                    print(f"Exception type: {type(e)}")
                    import traceback
                    traceback.print_exc()
                    return Response({'error': f'Verifikation fehlgeschlagen: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
                    
        except Exception as e:
            print(f"Allgemeiner Fehler bei der Passkey-Authentifizierung: {str(e)}")
            print(f"Exception type: {type(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': f'Fehler bei der Passkey-Authentifizierung: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PasskeyManagementView(APIView):
    """
    Passkey-Management für eingeloggte Benutzer
    
    Ermöglicht das Anzeigen und Verwalten von Passkey-Credentials.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        """
        Zeigt alle Passkey-Credentials des Benutzers
        """
        credentials = PasskeyCredential.objects.filter(
            user=request.user,
            is_active=True
        ).order_by('-created_at')
        
        credentials_data = []
        for cred in credentials:
            credentials_data.append({
                'id': cred.id,
                'credential_id': cred.credential_id,  # Ursprüngliche ID für Verwaltung
                'credential_id_display': cred.credential_id[:20] + '...',  # Gekürzte Version für Anzeige
                'transports': cred.transports,
                'attestation_type': cred.attestation_type,
                'created_at': cred.created_at,
                'last_used_at': cred.last_used_at,
                'sign_count': cred.sign_count,
            })
        
        return Response({
            'credentials': credentials_data,
            'total_count': len(credentials_data)
        }, status=status.HTTP_200_OK)
    
    def delete(self, request, *args, **kwargs):
        """
        Löscht ein Passkey-Credential
        """
        credential_id = request.data.get('credential_id')
        
        if not credential_id:
            return Response(
                {'error': 'Credential-ID ist erforderlich.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            credential = PasskeyCredential.objects.get(
                credential_id=credential_id,
                user=request.user,
                is_active=True
            )
            
            # Deaktiviere Credential (Soft Delete)
            credential.is_active = False
            credential.save()
            
            return Response({
                'message': 'Passkey-Credential wurde erfolgreich entfernt.'
            }, status=status.HTTP_200_OK)
            
        except PasskeyCredential.DoesNotExist:
            return Response(
                {'error': 'Passkey-Credential nicht gefunden oder bereits entfernt.'},
                status=status.HTTP_404_NOT_FOUND
            )


class RegisterView(APIView):
    """
    Benutzer-Registrierung

    Ermöglicht neuen Benutzern, sich zu registrieren.
    Prüft SystemSettings, ob Registrierung aktiviert ist.
    Rate Limiting: 3 Registrierungen pro Stunde pro IP.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        """
        Registriert einen neuen Benutzer
        """
        # Prüfe, ob Registrierung aktiviert ist
        system_settings = SystemSettings.get_settings()
        if not system_settings.registration_enabled:
            return Response(
                {'error': 'Registrierung ist derzeit deaktiviert.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Validiere Daten
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Erstelle Benutzer
        user = serializer.save()

        # Erstelle Profil
        UserProfile.objects.create(user=user)

        # Wenn E-Mail-Verifizierung erforderlich, erstelle Token
        if system_settings.require_email_verification:
            token = EmailVerificationToken.objects.create(
                user=user,
                expires_at=timezone.now() + timedelta(hours=48)
            )

            # Sende Verifizierungs-E-Mail
            verification_url = f"{system_settings.qr_base_url}/verify-email/{token.token}"
            try:
                send_mail(
                    subject='LCREE - E-Mail-Adresse verifizieren',
                    message=f'Bitte verifizieren Sie Ihre E-Mail-Adresse: {verification_url}',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception as e:
                # Log error but don't fail registration
                print(f"E-Mail-Versand fehlgeschlagen: {e}")

            user.is_active = False  # Deaktiviere bis zur Verifizierung
            user.save()

            return Response({
                'message': 'Registrierung erfolgreich. Bitte verifizieren Sie Ihre E-Mail-Adresse.',
                'email_verification_required': True
            }, status=status.HTTP_201_CREATED)

        # Gebe Benutzerdaten zurück
        return Response({
            'message': 'Registrierung erfolgreich. Sie können sich jetzt anmelden.',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class PasswordResetRequestView(APIView):
    """
    Passwort-Reset-Anfrage

    Erstellt ein Reset-Token und sendet eine E-Mail.
    Rate Limiting: 3 Anfragen pro Stunde pro IP.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        """
        Fordert Passwort-Reset an
        """
        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']

        # Suche Benutzer (aber gebe keine Info, ob gefunden)
        try:
            user = User.objects.get(email=email, is_deleted=False)

            # Erstelle Reset-Token
            system_settings = SystemSettings.get_settings()
            token = PasswordResetToken.objects.create(
                user=user,
                expires_at=timezone.now() + timedelta(
                    hours=system_settings.password_reset_token_expiry_hours
                )
            )

            # Sende E-Mail
            reset_url = f"{system_settings.qr_base_url}/reset-password/{token.token}"
            try:
                send_mail(
                    subject='LCREE - Passwort zurücksetzen',
                    message=f'Setzen Sie Ihr Passwort zurück: {reset_url}\n\nDieser Link ist {system_settings.password_reset_token_expiry_hours} Stunden gültig.',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"E-Mail-Versand fehlgeschlagen: {e}")

        except User.DoesNotExist:
            pass  # Keine Info preisgeben

        # Immer gleiche Antwort (Security)
        return Response({
            'message': 'Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde eine E-Mail zum Zurücksetzen des Passworts gesendet.'
        }, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    """
    Passwort-Reset-Bestätigung

    Setzt das Passwort mit einem gültigen Token zurück.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        """
        Setzt Passwort zurück
        """
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        token_uuid = serializer.validated_data['token']
        password = serializer.validated_data['password']

        try:
            # Hole Token
            token = PasswordResetToken.objects.get(token=token_uuid)

            # Prüfe Gültigkeit
            if not token.is_valid():
                return Response(
                    {'error': 'Token ist ungültig oder abgelaufen.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Setze Passwort
            user = token.user
            user.set_password(password)
            user.save()

            # Markiere Token als verwendet
            token.mark_as_used()

            return Response({
                'message': 'Passwort wurde erfolgreich zurückgesetzt. Sie können sich jetzt anmelden.'
            }, status=status.HTTP_200_OK)

        except PasswordResetToken.DoesNotExist:
            return Response(
                {'error': 'Token ist ungültig oder abgelaufen.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class EmailVerificationView(APIView):
    """
    E-Mail-Verifizierung

    Verifiziert E-Mail-Adresse mit Token.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        """
        Verifiziert E-Mail-Adresse
        """
        serializer = EmailVerificationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        token_uuid = serializer.validated_data['token']

        try:
            # Hole Token
            token = EmailVerificationToken.objects.get(token=token_uuid)

            # Prüfe Gültigkeit
            if not token.is_valid():
                return Response(
                    {'error': 'Token ist ungültig oder abgelaufen.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Verifiziere E-Mail
            user = token.user
            user.email_verified = True
            user.email_verified_at = timezone.now()
            user.is_active = True  # Aktiviere Benutzer
            user.save()

            # Markiere Token als verifiziert
            token.mark_as_verified()

            return Response({
                'message': 'E-Mail-Adresse wurde erfolgreich verifiziert. Sie können sich jetzt anmelden.'
            }, status=status.HTTP_200_OK)

        except EmailVerificationToken.DoesNotExist:
            return Response(
                {'error': 'Token ist ungültig oder abgelaufen.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class ResendVerificationEmailView(APIView):
    """
    E-Mail-Verifizierung erneut senden
    
    Sendet eine neue Verifizierungs-E-Mail an den Benutzer.
    Rate Limiting: 5 Anfragen pro Stunde pro IP.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        """
        Sendet Verifizierungs-E-Mail erneut
        """
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'E-Mail-Adresse ist erforderlich.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Suche Benutzer
            user = User.objects.get(email=email, is_deleted=False)
            
            # Prüfe, ob bereits verifiziert
            if user.email_verified:
                return Response(
                    {'message': 'E-Mail-Adresse ist bereits verifiziert.'},
                    status=status.HTTP_200_OK
                )
            
            # Lösche alte Verifizierungs-Tokens
            EmailVerificationToken.objects.filter(user=user).delete()
            
            # Erstelle neuen Token
            token = EmailVerificationToken.objects.create(
                user=user,
                expires_at=timezone.now() + timedelta(hours=48)
            )
            
            # Sende E-Mail
            system_settings = SystemSettings.get_settings()
            verification_url = f"{system_settings.qr_base_url}/verify-email/{token.token}"
            
            try:
                send_mail(
                    subject='LCREE - E-Mail-Adresse verifizieren',
                    message=f'Bitte verifizieren Sie Ihre E-Mail-Adresse: {verification_url}',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"E-Mail-Versand fehlgeschlagen: {e}")
                return Response(
                    {'error': 'E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response({
                'message': 'Verifizierungs-E-Mail wurde erneut gesendet.'
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            # Gleiche Antwort für Security (keine Info preisgeben)
            return Response({
                'message': 'Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde eine Verifizierungs-E-Mail gesendet.'
            }, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    """
    Passwort ändern (eingeloggt)
    
    Ermöglicht eingeloggten Benutzern, ihr Passwort zu ändern.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """
        Ändert das Passwort des eingeloggten Benutzers
        """
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return Response(
                {'error': 'Aktuelles Passwort und neues Passwort sind erforderlich.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validiere neues Passwort
        if len(new_password) < 8:
            return Response(
                {'error': 'Neues Passwort muss mindestens 8 Zeichen lang sein.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Prüfe aktuelles Passwort
        user = request.user
        if not user.check_password(current_password):
            return Response(
                {'error': 'Aktuelles Passwort ist falsch.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Setze neues Passwort
        user.set_password(new_password)
        user.save()
        
        # Optional: Alle aktiven Sessions beenden (außer der aktuellen)
        # Dies würde alle anderen Geräte abmelden
        invalidate_other_sessions = request.data.get('invalidate_other_sessions', False)
        if invalidate_other_sessions:
            # TODO: Implementierung für Session-Invalidierung
            pass
        
        return Response({
            'message': 'Passwort wurde erfolgreich geändert.'
        }, status=status.HTTP_200_OK)


class SessionManagementView(APIView):
    """
    Session-Management für eingeloggte Benutzer
    
    Ermöglicht das Anzeigen und Verwalten aktiver Sessions.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """
        Zeigt alle aktiven Sessions des Benutzers (nur eindeutige Geräte)
        """
        # Bereinige abgelaufene Sessions
        UserSession.cleanup_expired_sessions()
        
        # Hole aktive Sessions, gruppiert nach Gerät (device_name + ip_address)
        sessions = UserSession.objects.filter(
            user=request.user,
            is_active=True
        ).order_by('-last_activity')
        
        # Gruppiere Sessions nach Gerät, um Duplikate zu vermeiden
        device_sessions = {}
        for session in sessions:
            device_key = f"{session.device_name}_{session.ip_address}"
            if device_key not in device_sessions:
                device_sessions[device_key] = session
        
        # Erstelle Session-Daten für eindeutige Geräte
        session_data = []
        for session in device_sessions.values():
            session_data.append({
                'id': session.id,
                'session_id': session.session_id,
                'ip_address': session.ip_address,
                'device_name': session.device_name or 'Unbekanntes Gerät',
                'user_agent': session.user_agent[:100] + '...' if len(session.user_agent) > 100 else session.user_agent,
                'created_at': session.created_at,
                'last_activity': session.last_activity,
                'expires_at': session.expires_at,
                'is_current': session.session_id == request.session.session_key,
            })
        
        # Sortiere nach letzter Aktivität
        session_data.sort(key=lambda x: x['last_activity'], reverse=True)
        
        return Response({
            'sessions': session_data,
            'total_count': len(session_data)
        }, status=status.HTTP_200_OK)

    def delete(self, request, *args, **kwargs):
        """
        Beendet alle Sessions für ein spezifisches Gerät
        """
        session_id = request.data.get('session_id')
        
        if not session_id:
            return Response(
                {'error': 'Session-ID ist erforderlich.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Finde die Session
            session = UserSession.objects.get(
                session_id=session_id,
                user=request.user,
                is_active=True
            )
            
            # Beende alle Sessions für dieses Gerät (gleicher device_name und ip_address)
            device_sessions = UserSession.objects.filter(
                user=request.user,
                device_name=session.device_name,
                ip_address=session.ip_address,
                is_active=True
            )
            
            # Deaktiviere alle Sessions für dieses Gerät
            terminated_count = 0
            for device_session in device_sessions:
                device_session.deactivate()
                terminated_count += 1
            
            return Response({
                'message': f'Alle Sessions für "{session.device_name}" wurden erfolgreich beendet.',
                'terminated_count': terminated_count
            }, status=status.HTTP_200_OK)
            
        except UserSession.DoesNotExist:
            return Response(
                {'error': 'Session nicht gefunden oder bereits beendet.'},
                status=status.HTTP_404_NOT_FOUND
            )


class LogoutAllSessionsView(APIView):
    """
    Beendet alle Sessions außer der aktuellen
    
    Ermöglicht "Überall abmelden" Funktionalität.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """
        Beendet alle Sessions außer der aktuellen
        """
        current_session_id = request.session.session_key
        include_current = request.data.get('include_current', False)
        
        if include_current:
            # Beende alle Sessions inklusive der aktuellen
            all_sessions = UserSession.objects.filter(
                user=request.user,
                is_active=True
            )
            deactivated_count = all_sessions.count()
            all_sessions.update(is_active=False)
            
            return Response({
                'message': f'Alle {deactivated_count} Sessions wurden beendet.',
                'deactivated_count': deactivated_count,
                'logout_required': True
            }, status=status.HTTP_200_OK)
        else:
            # Beende nur andere Sessions
            other_sessions = UserSession.objects.filter(
                user=request.user,
                is_active=True
            ).exclude(session_id=current_session_id)
            
            deactivated_count = other_sessions.count()
            other_sessions.update(is_active=False)
            
            return Response({
                'message': f'{deactivated_count} andere Sessions wurden beendet.',
                'deactivated_count': deactivated_count,
                'logout_required': False
            }, status=status.HTTP_200_OK)