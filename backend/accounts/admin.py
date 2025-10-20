"""
LCREE Accounts Admin
====================

Django Admin-Konfiguration für die Accounts-App.

Features:
- Benutzerverwaltung mit Rollen
- Passkey-Credential-Verwaltung
- Benutzerprofil-Verwaltung
- Soft-Delete-Unterstützung
- Erweiterte Such- und Filterfunktionen
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import (
    User, PasskeyCredential, UserProfile,
    PasswordResetToken, EmailVerificationToken
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Erweiterte Benutzerverwaltung für LCREE
    
    Basiert auf Django's BaseUserAdmin mit zusätzlichen Feldern
    für Rollen, Soft-Delete und erweiterte Profildaten.
    """
    
    # Felder für die Listenansicht
    list_display = [
        'email', 'get_full_name', 'role', 'is_active', 'is_deleted', 
        'created_at', 'last_login'
    ]
    list_filter = [
        'role', 'is_active', 'is_deleted', 'is_staff', 'is_superuser',
        'created_at', 'last_login'
    ]
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    # Felder für die Detailansicht
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Persönliche Informationen', {
            'fields': ('first_name', 'last_name', 'avatar')
        }),
        ('Berechtigungen', {
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Einstellungen', {
            'fields': ('language', 'timezone')
        }),
        ('Soft-Delete', {
            'fields': ('is_deleted', 'deleted_at', 'deleted_by'),
            'classes': ('collapse',)
        }),
        ('Zeitstempel', {
            'fields': ('created_at', 'updated_at', 'last_login', 'date_joined'),
            'classes': ('collapse',)
        }),
    )
    
    # Felder für die Erstellung
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at', 'date_joined']
    
    def get_full_name(self, obj):
        """Zeigt den vollständigen Namen des Benutzers"""
        return obj.get_full_name()
    get_full_name.short_description = 'Vollständiger Name'
    
    def get_queryset(self, request):
        """Filtert gelöschte Benutzer aus der Standardansicht"""
        qs = super().get_queryset(request)
        if request.GET.get('is_deleted') == '1':
            return qs.filter(is_deleted=True)
        return qs.filter(is_deleted=False)


@admin.register(PasskeyCredential)
class PasskeyCredentialAdmin(admin.ModelAdmin):
    """
    Verwaltung von Passkey-Credentials
    
    Zeigt alle WebAuthn/Passkey-Credentials mit
    Verwendungsstatistiken und Verwaltungsfunktionen.
    """
    
    list_display = [
        'user', 'credential_id_short', 'attestation_type', 
        'sign_count', 'last_used_at', 'created_at'
    ]
    list_filter = ['attestation_type', 'created_at', 'last_used_at']
    search_fields = ['user__email', 'credential_id']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Credential-Informationen', {
            'fields': ('user', 'credential_id', 'attestation_type')
        }),
        ('Schlüssel-Daten', {
            'fields': ('public_key', 'sign_count', 'transports'),
            'classes': ('collapse',)
        }),
        ('Verwendung', {
            'fields': ('last_used_at', 'created_at')
        }),
    )
    
    readonly_fields = ['created_at', 'last_used_at']
    
    def credential_id_short(self, obj):
        """Zeigt eine gekürzte Version der Credential-ID"""
        return f"{obj.credential_id[:20]}..." if len(obj.credential_id) > 20 else obj.credential_id
    credential_id_short.short_description = 'Credential-ID'
    
    def get_queryset(self, request):
        """Optimiert die Abfrage mit select_related"""
        return super().get_queryset(request).select_related('user')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """
    Verwaltung von Benutzerprofilen
    
    Zeigt erweiterte Profildaten und Einstellungen
    der Benutzer.
    """
    
    list_display = [
        'user', 'notifications_enabled', 'last_login_ip', 
        'created_at', 'updated_at'
    ]
    list_filter = ['notifications_enabled', 'created_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    ordering = ['-updated_at']
    
    fieldsets = (
        ('Benutzer', {
            'fields': ('user',)
        }),
        ('Einstellungen', {
            'fields': ('notifications_enabled', 'dashboard_widgets')
        }),
        ('Login-Informationen', {
            'fields': ('last_login_ip', 'last_login_user_agent'),
            'classes': ('collapse',)
        }),
        ('Zeitstempel', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        """Optimiert die Abfrage mit select_related"""
        return super().get_queryset(request).select_related('user')


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    """
    Verwaltung von Passwort-Reset-Tokens

    Zeigt alle generierten Reset-Tokens mit Status und Ablaufzeit.
    """

    list_display = [
        'user', 'token_short', 'created_at', 'expires_at',
        'used_at', 'is_valid_status'
    ]
    list_filter = ['created_at', 'expires_at', 'used_at']
    search_fields = ['user__email', 'token']
    ordering = ['-created_at']

    fieldsets = (
        ('Token-Informationen', {
            'fields': ('user', 'token', 'expires_at')
        }),
        ('Verwendung', {
            'fields': ('used_at', 'created_at')
        }),
    )

    readonly_fields = ['token', 'created_at']

    def token_short(self, obj):
        """Zeigt eine gekürzte Version des Tokens"""
        return f"{str(obj.token)[:8]}..."
    token_short.short_description = 'Token'

    def is_valid_status(self, obj):
        """Zeigt den Gültigkeitsstatus"""
        if obj.is_valid():
            return format_html('<span style="color: green;">✓ Gültig</span>')
        return format_html('<span style="color: red;">✗ Ungültig</span>')
    is_valid_status.short_description = 'Status'

    def get_queryset(self, request):
        """Optimiert die Abfrage mit select_related"""
        return super().get_queryset(request).select_related('user')


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    """
    Verwaltung von E-Mail-Verifizierungs-Tokens

    Zeigt alle Verifizierungs-Tokens mit Status und Ablaufzeit.
    """

    list_display = [
        'user', 'token_short', 'created_at', 'expires_at',
        'verified_at', 'is_valid_status'
    ]
    list_filter = ['created_at', 'expires_at', 'verified_at']
    search_fields = ['user__email', 'token']
    ordering = ['-created_at']

    fieldsets = (
        ('Token-Informationen', {
            'fields': ('user', 'token', 'expires_at')
        }),
        ('Verifizierung', {
            'fields': ('verified_at', 'created_at')
        }),
    )

    readonly_fields = ['token', 'created_at']

    def token_short(self, obj):
        """Zeigt eine gekürzte Version des Tokens"""
        return f"{str(obj.token)[:8]}..."
    token_short.short_description = 'Token'

    def is_valid_status(self, obj):
        """Zeigt den Gültigkeitsstatus"""
        if obj.is_valid():
            return format_html('<span style="color: green;">✓ Gültig</span>')
        return format_html('<span style="color: red;">✗ Ungültig</span>')
    is_valid_status.short_description = 'Status'

    def get_queryset(self, request):
        """Optimiert die Abfrage mit select_related"""
        return super().get_queryset(request).select_related('user')


# Anpassung der Admin-Site
admin.site.site_header = "LCREE Backend Administration"
admin.site.site_title = "LCREE Admin"
admin.site.index_title = "Verwaltung"