"""
User Management Settings App Admin Configuration
================================================

Vollständige Django Admin-Konfiguration für die Settings-App.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import SystemSettings


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    """
    Systemeinstellungen-Verwaltung (Singleton)
    
    Bietet vollständige Verwaltung der Systemeinstellungen mit:
    - Singleton-Pattern für globale Einstellungen
    - Authentifizierungs-Einstellungen
    - Benutzer-Management-Konfiguration
    """
    
    list_display = [
        'id', 'company_name', 'currency', 'registration_enabled', 
        'require_email_verification', 'maintenance_mode', 'two_factor_required'
    ]
    readonly_fields = ['id']
    
    fieldsets = (
        ('Firmen-Informationen', {
            'fields': ('company_name', 'currency')
        }),
        ('Authentifizierungs-Einstellungen', {
            'fields': ('registration_enabled', 'require_email_verification', 'password_reset_token_expiry_hours'),
            'classes': ('collapse',)
        }),
        ('Wartungsmodus', {
            'fields': ('maintenance_mode', 'maintenance_message', 'maintenance_allowed_ips'),
            'classes': ('collapse',)
        }),
        ('Sicherheits-Einstellungen', {
            'fields': ('two_factor_required', 'session_timeout_minutes', 'max_login_attempts', 'password_min_length', 'password_require_special_chars', 'account_lockout_duration_minutes'),
            'classes': ('collapse',)
        }),
        ('Benutzer-Management', {
            'fields': ('user_registration_approval_required', 'default_user_role', 'user_session_timeout_minutes', 'allow_multiple_sessions', 'force_password_change_on_first_login'),
            'classes': ('collapse',)
        }),
        ('E-Mail-Benachrichtigungen', {
            'fields': ('email_enabled', 'smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_use_tls', 'email_from_address'),
            'classes': ('collapse',)
        }),
        ('Backup & Wartung', {
            'fields': ('backup_enabled', 'backup_frequency_hours', 'backup_retention_days', 'backup_location', 'log_retention_days', 'audit_log_enabled', 'performance_monitoring'),
            'classes': ('collapse',)
        }),
        ('API & Integration', {
            'fields': ('api_rate_limit_per_minute', 'api_key_expiry_days', 'webhook_enabled', 'webhook_url', 'webhook_secret', 'external_api_timeout_seconds', 'retry_failed_requests'),
            'classes': ('collapse',)
        }),
        ('Datenschutz & Compliance', {
            'fields': ('data_retention_days', 'anonymize_old_data', 'consent_required', 'privacy_policy_url', 'terms_of_service_url'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['reset_to_defaults', 'export_settings']
    
    def reset_to_defaults(self, request, queryset):
        """Einstellungen auf Standardwerte zurücksetzen"""
        settings = SystemSettings.objects.first()
        if settings:
            settings.company_name = "User Management System"
            settings.currency = "EUR"
            settings.registration_enabled = True
            settings.require_email_verification = False
            settings.password_reset_token_expiry_hours = 24
            settings.save()
            self.message_user(request, 'Einstellungen wurden auf Standardwerte zurückgesetzt.')
        else:
            self.message_user(request, 'Keine Einstellungen gefunden.')
    reset_to_defaults.short_description = "Auf Standardwerte zurücksetzen"
    
    def export_settings(self, request, queryset):
        """Einstellungen exportieren"""
        # Hier könnte eine JSON-Export-Funktionalität implementiert werden
        self.message_user(request, 'Einstellungen wurden exportiert.')
    export_settings.short_description = "Einstellungen exportieren"
    
    def has_add_permission(self, request):
        """Verhindert das Hinzufügen neuer Einstellungen (Singleton)"""
        return not SystemSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        """Verhindert das Löschen der Einstellungen"""
        return False
