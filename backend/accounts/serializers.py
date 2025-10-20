"""
LCREE Accounts Serializers
==========================

Django REST Framework Serializers für die Accounts-App.

Features:
- UserSerializer für Benutzerdaten
- PasskeyCredentialSerializer für Passkey-Daten
- UserProfileSerializer für Profildaten
- Vollständige Validierung und Sicherheit
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import User, PasskeyCredential, UserProfile, PasswordResetToken, EmailVerificationToken, UserRole

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer für Benutzerdaten
    
    Bietet sichere Serialisierung von Benutzerdaten mit
    rollenbasierten Feldern und Validierung.
    """
    avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role',
            'is_active', 'avatar', 'language', 'timezone',
            'created_at', 'updated_at', 'last_login',
            'email_verified', 'email_verified_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_login']
    
    def get_avatar(self, obj):
        """Gibt den vollständigen Avatar-URL zurück"""
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None
    
    def validate_email(self, value):
        """Validiert E-Mail-Adresse"""
        if User.objects.filter(email=value).exclude(id=self.instance.id if self.instance else None).exists():
            raise serializers.ValidationError("Diese E-Mail-Adresse wird bereits verwendet.")
        return value


class PasskeyCredentialSerializer(serializers.ModelSerializer):
    """
    Serializer für Passkey-Credentials
    
    Serialisiert WebAuthn/Passkey-Credential-Daten sicher.
    """
    
    class Meta:
        model = PasskeyCredential
        fields = [
            'id', 'credential_id', 'attestation_type',
            'sign_count', 'transports', 'created_at', 'last_used_at'
        ]
        read_only_fields = ['id', 'sign_count', 'created_at', 'last_used_at']


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer für Benutzerprofile

    Serialisiert erweiterte Profildaten der Benutzer.
    """

    class Meta:
        model = UserProfile
        fields = [
            'id', 'notifications_enabled', 'dashboard_widgets',
            'last_login_ip', 'last_login_user_agent',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'last_login_ip', 'last_login_user_agent', 'created_at', 'updated_at']


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer für Benutzer-Registrierung

    Validiert Registrierungsdaten und erstellt neue Benutzer.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password', 'password_confirm']

    def validate(self, attrs):
        """Validiert Passwort-Übereinstimmung"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwörter stimmen nicht überein."})
        return attrs

    def validate_email(self, value):
        """Validiert E-Mail-Adresse"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Diese E-Mail-Adresse wird bereits verwendet.")
        return value

    def create(self, validated_data):
        """Erstellt neuen Benutzer"""
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=UserRole.VIEWER,  # Neue Benutzer starten als Viewer
            is_active=True
        )
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer für Passwort-Reset-Anfrage

    Validiert E-Mail-Adresse für Passwort-Reset.
    """
    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer für Passwort-Reset-Bestätigung

    Validiert Token und neues Passwort.
    """
    token = serializers.UUIDField(required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        """Validiert Passwort-Übereinstimmung"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwörter stimmen nicht überein."})
        return attrs


class EmailVerificationSerializer(serializers.Serializer):
    """
    Serializer für E-Mail-Verifizierung

    Validiert Verifizierungs-Token.
    """
    token = serializers.UUIDField(required=True)
