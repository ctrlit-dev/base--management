"""
LCREE Accounts Models
=====================

Benutzerverwaltung und Authentifizierung für das LCREE-System.

Features:
- Erweiterte User-Model mit Rollen (ADMIN, PRODUCTION, WAREHOUSE, SALES, VIEWER)
- Passkeys/WebAuthn für passwortlose Authentifizierung
- Soft-Delete für alle Benutzerdaten
- Audit-Trail für alle Benutzeränderungen

Wichtige Konzepte:
- Rollenbasierte Berechtigungen
- FIDO2/WebAuthn für höchste Sicherheit
- JWT als Fallback-Option
- Vollständige Nachverfolgung aller Aktionen
"""

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator
import uuid


class UserManager(BaseUserManager):
    """
    Benutzerdefinierter UserManager für E-Mail-basierte Authentifizierung
    """
    
    def create_user(self, email, password=None, **extra_fields):
        """
        Erstellt einen normalen Benutzer
        """
        if not email:
            raise ValueError('E-Mail-Adresse ist erforderlich')
        
        email = self.normalize_email(email)
        user = self.model(email=email, username=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """
        Erstellt einen Superuser
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', UserRole.SUPER_ADMIN)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser muss is_staff=True haben.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser muss is_superuser=True haben.')
        
        return self.create_user(email, password, **extra_fields)


class UserRole(models.TextChoices):
    """
    Allgemeine Benutzerrollen für das Benutzer-Management-System
    
    SUPER_ADMIN: Vollzugriff auf alle Systemfunktionen
    ADMIN: Benutzer- und Systemverwaltung
    MANAGER: Team- und Projektverwaltung
    USER: Standard-Benutzer mit grundlegenden Funktionen
    GUEST: Gast mit nur Lesezugriff
    """
    SUPER_ADMIN = 'SUPER_ADMIN', 'Super-Administrator'
    ADMIN = 'ADMIN', 'Administrator'
    MANAGER = 'MANAGER', 'Manager'
    USER = 'USER', 'Benutzer'
    GUEST = 'GUEST', 'Gast'


class User(AbstractUser):
    """
    Erweiterte Benutzer-Model für LCREE
    
    Erweitert Django's AbstractUser um:
    - Rollenbasierte Berechtigungen
    - Soft-Delete Funktionalität
    - Erweiterte Profildaten
    - Audit-Trail Integration
    """
    
    # Benutzerdefinierter Manager
    objects = UserManager()
    
    # Eindeutige E-Mail-Adresse (überschreibt username)
    email = models.EmailField(
        unique=True,
        verbose_name="E-Mail-Adresse",
        help_text="Eindeutige E-Mail-Adresse für Anmeldung und Benachrichtigungen"
    )
    
    # Benutzerrolle für Berechtigungen
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.USER,
        verbose_name="Benutzerrolle",
        help_text="Rolle bestimmt die verfügbaren Funktionen im System"
    )
    
    # Soft-Delete Felder
    is_deleted = models.BooleanField(
        default=False,
        verbose_name="Gelöscht",
        help_text="Markiert den Benutzer als gelöscht (Soft-Delete)"
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Gelöscht am",
        help_text="Zeitpunkt der Löschung"
    )
    deleted_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deleted_users',
        verbose_name="Gelöscht von",
        help_text="Benutzer, der die Löschung durchgeführt hat"
    )
    
    # E-Mail-Verifizierung
    email_verified = models.BooleanField(
        default=False,
        verbose_name="E-Mail verifiziert",
        help_text="Wurde die E-Mail-Adresse verifiziert?"
    )
    email_verified_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="E-Mail verifiziert am"
    )
    
    # Login-Tracking für Sicherheit
    last_login_ip = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name="Letzte Login-IP",
        help_text="IP-Adresse des letzten Logins"
    )
    last_login_device = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="Letztes Login-Gerät",
        help_text="User-Agent des letzten Logins"
    )
    login_notifications_enabled = models.BooleanField(
        default=True,
        verbose_name="Login-Benachrichtigungen aktiviert",
        help_text="E-Mail-Benachrichtigungen bei Login von neuer IP/Gerät"
    )

    # Erweiterte Profildaten
    avatar = models.ImageField(
        upload_to='avatars/',
        null=True,
        blank=True,
        verbose_name="Profilbild",
        help_text="Optionales Profilbild des Benutzers"
    )
    language = models.CharField(
        max_length=5,
        default='de-DE',
        verbose_name="Sprache",
        help_text="Bevorzugte Sprache des Benutzers"
    )
    timezone = models.CharField(
        max_length=50,
        default='Europe/Berlin',
        verbose_name="Zeitzone",
        help_text="Bevorzugte Zeitzone des Benutzers"
    )
    
    # Audit-Felder
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Erstellt am"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Aktualisiert am"
    )
    
    # Django-spezifische Einstellungen
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        verbose_name = "Benutzer"
        verbose_name_plural = "Benutzer"
        ordering = ['last_name', 'first_name']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['is_deleted']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        """String-Darstellung des Benutzers"""
        return f"{self.get_full_name()} ({self.email})"
    
    def get_full_name(self):
        """Vollständiger Name des Benutzers"""
        return f"{self.first_name} {self.last_name}".strip() or self.email
    
    def soft_delete(self, deleted_by_user=None):
        """
        Soft-Delete des Benutzers
        
        Args:
            deleted_by_user: Benutzer, der die Löschung durchführt
        """
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.deleted_by = deleted_by_user
        self.is_active = False  # Deaktiviere auch den Account
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by', 'is_active'])
    
    def restore(self):
        """Wiederherstellung eines gelöschten Benutzers"""
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None
        self.is_active = True
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by', 'is_active'])
    
    def has_role(self, role):
        """Prüft, ob der Benutzer eine bestimmte Rolle hat"""
        return self.role == role
    
    def is_admin(self):
        """Prüft, ob der Benutzer Administrator ist"""
        return self.has_role(UserRole.ADMIN)
    
    def can_produce(self):
        """Prüft, ob der Benutzer produzieren darf"""
        return self.role in [UserRole.ADMIN, UserRole.PRODUCTION]
    
    def can_manage_warehouse(self):
        """Prüft, ob der Benutzer das Lager verwalten darf"""
        return self.role in [UserRole.ADMIN, UserRole.WAREHOUSE]
    
    def can_sell(self):
        """Prüft, ob der Benutzer verkaufen darf"""
        return self.role in [UserRole.ADMIN, UserRole.PRODUCTION, UserRole.SALES]


class PasskeyCredential(models.Model):
    """
    WebAuthn/Passkey-Credentials für passwortlose Authentifizierung
    
    Speichert die notwendigen Daten für FIDO2/WebAuthn-Authentifizierung:
    - Credential ID (öffentlicher Schlüssel)
    - Public Key für Verifikation
    - Sign Count für Replay-Schutz
    - Transport-Methoden (USB, NFC, etc.)
    """
    
    # Eindeutige Credential-ID (Base64-kodiert)
    credential_id = models.CharField(
        max_length=255,
        unique=True,
        verbose_name="Credential-ID",
        help_text="Eindeutige Kennung des Passkey-Credentials"
    )
    
    # Benutzer, dem dieses Credential gehört
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='passkey_credentials',
        verbose_name="Benutzer",
        help_text="Benutzer, dem dieses Passkey-Credential gehört"
    )
    
    # Öffentlicher Schlüssel (Base64-kodiert)
    public_key = models.TextField(
        verbose_name="Öffentlicher Schlüssel",
        help_text="Öffentlicher Schlüssel für Verifikation der Authentifizierung"
    )
    
    # Sign Count für Replay-Schutz
    sign_count = models.PositiveIntegerField(
        default=0,
        verbose_name="Sign Count",
        help_text="Anzahl der erfolgreichen Authentifizierungen (Replay-Schutz)"
    )
    
    # Transport-Methoden (USB, NFC, etc.)
    transports = models.JSONField(
        default=list,
        verbose_name="Transport-Methoden",
        help_text="Verfügbare Transport-Methoden für das Credential"
    )
    
    # Attestation-Typ
    attestation_type = models.CharField(
        max_length=50,
        verbose_name="Attestation-Typ",
        help_text="Typ der Attestation (none, indirect, direct, enterprise)"
    )
    
    # Status-Felder
    is_active = models.BooleanField(
        default=True,
        verbose_name="Aktiv",
        help_text="Gibt an, ob das Credential aktiv ist"
    )
    
    # Audit-Felder
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Erstellt am"
    )
    last_used_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Zuletzt verwendet am"
    )
    
    class Meta:
        verbose_name = "Passkey-Credential"
        verbose_name_plural = "Passkey-Credentials"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['credential_id']),
            models.Index(fields=['user']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        """String-Darstellung des Credentials"""
        return f"Passkey für {self.user.email} ({self.created_at.strftime('%d.%m.%Y')})"
    
    def update_sign_count(self, new_sign_count):
        """
        Aktualisiert den Sign Count und die letzte Verwendung
        
        Args:
            new_sign_count: Neuer Sign Count vom Authenticator
        """
        if new_sign_count <= self.sign_count:
            raise ValueError("Sign Count muss größer als der aktuelle Wert sein")
        
        self.sign_count = new_sign_count
        self.last_used_at = timezone.now()
        self.save(update_fields=['sign_count', 'last_used_at'])
    
    def is_valid(self):
        """Prüft, ob das Credential noch gültig ist"""
        return not self.user.is_deleted and self.user.is_active


class PasswordResetToken(models.Model):
    """
    Token für Passwort-Reset

    Speichert temporäre Tokens für sichere Passwort-Zurücksetzung.
    """

    # Token (UUID)
    token = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
        verbose_name="Token"
    )

    # Benutzer
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='password_reset_tokens',
        verbose_name="Benutzer"
    )

    # Ablaufzeit
    expires_at = models.DateTimeField(
        verbose_name="Läuft ab am",
        help_text="Zeitpunkt, ab dem das Token ungültig wird"
    )

    # Verwendung
    used_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Verwendet am",
        help_text="Zeitpunkt der Verwendung (NULL = noch nicht verwendet)"
    )

    # Audit-Felder
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Erstellt am"
    )

    class Meta:
        verbose_name = "Passwort-Reset-Token"
        verbose_name_plural = "Passwort-Reset-Tokens"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        """String-Darstellung des Tokens"""
        return f"Reset-Token für {self.user.email} ({self.created_at.strftime('%d.%m.%Y %H:%M')})"

    def is_valid(self):
        """Prüft, ob das Token noch gültig ist"""
        if self.used_at:
            return False
        if timezone.now() > self.expires_at:
            return False
        return True

    def mark_as_used(self):
        """Markiert das Token als verwendet"""
        self.used_at = timezone.now()
        self.save(update_fields=['used_at'])


class EmailVerificationToken(models.Model):
    """
    Token für E-Mail-Verifizierung

    Speichert temporäre Tokens für E-Mail-Adress-Verifizierung.
    """

    # Token (UUID)
    token = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
        verbose_name="Token"
    )

    # Benutzer
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='email_verification_tokens',
        verbose_name="Benutzer"
    )

    # Ablaufzeit
    expires_at = models.DateTimeField(
        verbose_name="Läuft ab am",
        help_text="Zeitpunkt, ab dem das Token ungültig wird"
    )

    # Verwendung
    verified_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Verifiziert am",
        help_text="Zeitpunkt der Verifizierung"
    )

    # Audit-Felder
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Erstellt am"
    )

    class Meta:
        verbose_name = "E-Mail-Verifizierungs-Token"
        verbose_name_plural = "E-Mail-Verifizierungs-Tokens"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        """String-Darstellung des Tokens"""
        return f"Verifizierungs-Token für {self.user.email} ({self.created_at.strftime('%d.%m.%Y %H:%M')})"

    def is_valid(self):
        """Prüft, ob das Token noch gültig ist"""
        if self.verified_at:
            return False
        if timezone.now() > self.expires_at:
            return False
        return True

    def mark_as_verified(self):
        """Markiert das Token als verifiziert"""
        self.verified_at = timezone.now()
        self.save(update_fields=['verified_at'])


class UserProfile(models.Model):
    """
    Erweiterte Profildaten für Benutzer

    Speichert zusätzliche Informationen und Einstellungen,
    die nicht direkt im User-Model stehen sollen.
    """
    
    # Benutzer
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
        verbose_name="Benutzer"
    )
    
    # Erweiterte Einstellungen
    notifications_enabled = models.BooleanField(
        default=True,
        verbose_name="Benachrichtigungen aktiviert",
        help_text="E-Mail-Benachrichtigungen aktiviert"
    )
    
    # Dashboard-Einstellungen
    dashboard_widgets = models.JSONField(
        default=dict,
        verbose_name="Dashboard-Widgets",
        help_text="Konfiguration der Dashboard-Widgets"
    )
    
    # Letzte Aktivität
    last_login_ip = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name="Letzte Login-IP"
    )
    last_login_user_agent = models.TextField(
        null=True,
        blank=True,
        verbose_name="Letzter User-Agent"
    )
    
    # Audit-Felder
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Erstellt am"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Aktualisiert am"
    )
    
    class Meta:
        verbose_name = "Benutzerprofil"
        verbose_name_plural = "Benutzerprofile"
    
    def __str__(self):
        """String-Darstellung des Profils"""
        return f"Profil von {self.user.get_full_name()}"
    
    def update_login_info(self, ip_address, user_agent):
        """
        Aktualisiert die Login-Informationen
        
        Args:
            ip_address: IP-Adresse des Logins
            user_agent: User-Agent des Browsers
        """
        self.last_login_ip = ip_address
        self.last_login_user_agent = user_agent
        self.save(update_fields=['last_login_ip', 'last_login_user_agent'])


class UserSession(models.Model):
    """
    Model für aktive Benutzer-Sessions
    
    Verfolgt aktive Login-Sessions für Session-Management.
    """
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='active_sessions',
        verbose_name="Benutzer"
    )
    
    # Session-Identifikation
    session_id = models.CharField(
        max_length=255,
        unique=True,
        verbose_name="Session-ID",
        help_text="Eindeutige Session-Identifikation"
    )
    
    # Session-Details
    ip_address = models.GenericIPAddressField(
        verbose_name="IP-Adresse",
        help_text="IP-Adresse der Session"
    )
    user_agent = models.TextField(
        verbose_name="User-Agent",
        help_text="Browser/Gerät-Informationen"
    )
    device_name = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="Gerätename",
        help_text="Benutzerfreundlicher Gerätename"
    )
    
    # Session-Status
    is_active = models.BooleanField(
        default=True,
        verbose_name="Aktiv",
        help_text="Ist die Session noch aktiv?"
    )
    
    # Zeitstempel
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Erstellt am",
        help_text="Zeitpunkt der Session-Erstellung"
    )
    last_activity = models.DateTimeField(
        auto_now=True,
        verbose_name="Letzte Aktivität",
        help_text="Zeitpunkt der letzten Aktivität"
    )
    expires_at = models.DateTimeField(
        verbose_name="Läuft ab am",
        help_text="Zeitpunkt des Session-Ablaufs"
    )
    
    class Meta:
        verbose_name = "Benutzer-Session"
        verbose_name_plural = "Benutzer-Sessions"
        ordering = ['-last_activity']
    
    def __str__(self):
        return f"{self.user.email} - {self.device_name or 'Unbekanntes Gerät'} ({self.ip_address})"
    
    def is_expired(self):
        """Prüft, ob die Session abgelaufen ist"""
        return timezone.now() > self.expires_at
    
    def deactivate(self):
        """Deaktiviert die Session"""
        self.is_active = False
        self.save(update_fields=['is_active'])
    
    @classmethod
    def cleanup_expired_sessions(cls):
        """Bereinigt abgelaufene Sessions"""
        expired_sessions = cls.objects.filter(
            expires_at__lt=timezone.now(),
            is_active=True
        )
        expired_sessions.update(is_active=False)
        return expired_sessions.count()


class PasskeyAuthChallenge(models.Model):
    """
    Temporäre Speicherung von Passkey-Authentifizierungs-Challenges
    
    Wird für Cross-Device Authentication verwendet, wenn die Session
    nicht zwischen Geräten synchronisiert werden kann.
    """
    challenge = models.TextField(help_text="Base64-kodierte Challenge")
    expires_at = models.DateTimeField(help_text="Ablaufzeit der Challenge")
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False, help_text="Ob die Challenge bereits verwendet wurde")
    
    class Meta:
        db_table = 'accounts_passkey_auth_challenge'
        verbose_name = 'Passkey Auth Challenge'
        verbose_name_plural = 'Passkey Auth Challenges'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Challenge {self.id} (expires: {self.expires_at})"
    
    def is_expired(self):
        """Prüft, ob die Challenge abgelaufen ist"""
        return timezone.now() > self.expires_at
    
    def mark_as_used(self):
        """Markiert die Challenge als verwendet"""
        self.used = True
        self.save(update_fields=['used'])
    
    @classmethod
    def cleanup_expired_challenges(cls):
        """Bereinigt abgelaufene Challenges"""
        expired_challenges = cls.objects.filter(
            expires_at__lt=timezone.now()
        )
        count = expired_challenges.count()
        expired_challenges.delete()
        return count