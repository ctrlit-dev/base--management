"""
User Management Settings Models
===============================

Systemeinstellungen Verwaltung für das User Management System.

Features:
- Singleton-Pattern für Systemeinstellungen
- Konfigurierbare Parameter für Benutzerverwaltung
- Authentifizierungs-Einstellungen
- Sicherheits-Einstellungen
"""

from django.db import models
from django.utils import timezone


class SystemSettings(models.Model):
    """Systemeinstellungen als Singleton"""
    
    # Grundlegende Einstellungen
    company_name = models.CharField(max_length=100, default='User Management System', verbose_name="Firmenname")
    currency = models.CharField(max_length=3, default='EUR', verbose_name="Währung")

    # Authentifizierungs-Einstellungen
    registration_enabled = models.BooleanField(
        default=True,
        verbose_name="Registrierung aktiviert",
        help_text="Erlaubt neuen Benutzern sich zu registrieren"
    )
    require_email_verification = models.BooleanField(
        default=False,
        verbose_name="E-Mail-Verifizierung erforderlich",
        help_text="Neue Benutzer müssen ihre E-Mail-Adresse verifizieren"
    )
    password_reset_token_expiry_hours = models.IntegerField(
        default=24,
        verbose_name="Passwort-Reset Token-Gültigkeit (Stunden)"
    )
    
    # Wartungsmodus
    maintenance_mode = models.BooleanField(
        default=False,
        verbose_name="Wartungsmodus aktiviert",
        help_text="Aktiviert den Wartungsmodus für das System"
    )
    maintenance_message = models.TextField(
        default="Das System befindet sich im Wartungsmodus. Bitte versuchen Sie es später erneut.",
        verbose_name="Wartungsmodus-Nachricht"
    )
    maintenance_allowed_ips = models.JSONField(
        default=list,
        verbose_name="Erlaubte IP-Adressen im Wartungsmodus",
        help_text="JSON-Array mit IP-Adressen die Zugriff haben"
    )
    
    # Sicherheits-Einstellungen
    two_factor_required = models.BooleanField(
        default=False,
        verbose_name="Zwei-Faktor-Authentifizierung erforderlich"
    )
    session_timeout_minutes = models.IntegerField(
        default=60,
        verbose_name="Session-Timeout (Minuten)"
    )
    max_login_attempts = models.IntegerField(
        default=5,
        verbose_name="Maximale Login-Versuche"
    )
    password_min_length = models.IntegerField(
        default=8,
        verbose_name="Mindestlänge Passwort"
    )
    password_require_special_chars = models.BooleanField(
        default=True,
        verbose_name="Sonderzeichen im Passwort erforderlich"
    )
    account_lockout_duration_minutes = models.IntegerField(
        default=15,
        verbose_name="Account-Sperrung Dauer (Minuten)"
    )
    
    # Benachrichtigungs-Einstellungen
    email_enabled = models.BooleanField(
        default=False,
        verbose_name="E-Mail-Benachrichtigungen aktiviert"
    )
    smtp_host = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="SMTP-Host"
    )
    smtp_port = models.IntegerField(
        default=587,
        verbose_name="SMTP-Port"
    )
    smtp_username = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="SMTP-Benutzername"
    )
    smtp_password = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="SMTP-Passwort"
    )
    smtp_use_tls = models.BooleanField(
        default=True,
        verbose_name="SMTP TLS verwenden"
    )
    email_from_address = models.EmailField(
        blank=True,
        verbose_name="E-Mail-Absender-Adresse"
    )
    notify_on_user_registration = models.BooleanField(
        default=True,
        verbose_name="Bei Benutzer-Registrierung benachrichtigen"
    )
    notify_on_failed_login = models.BooleanField(
        default=True,
        verbose_name="Bei fehlgeschlagenen Logins benachrichtigen"
    )
    notify_on_system_errors = models.BooleanField(
        default=True,
        verbose_name="Bei System-Fehlern benachrichtigen"
    )
    notify_on_maintenance_mode = models.BooleanField(
        default=True,
        verbose_name="Bei Wartungsmodus benachrichtigen"
    )
    
    # Backup & Wartung
    backup_enabled = models.BooleanField(
        default=False,
        verbose_name="Backup aktiviert"
    )
    backup_frequency_hours = models.IntegerField(
        default=24,
        verbose_name="Backup-Häufigkeit (Stunden)"
    )
    backup_retention_days = models.IntegerField(
        default=30,
        verbose_name="Backup-Aufbewahrung (Tage)"
    )
    backup_location = models.CharField(
        max_length=500,
        blank=True,
        verbose_name="Backup-Speicherort"
    )
    log_retention_days = models.IntegerField(
        default=90,
        verbose_name="Log-Aufbewahrung (Tage)"
    )
    audit_log_enabled = models.BooleanField(
        default=True,
        verbose_name="Audit-Log aktiviert"
    )
    performance_monitoring = models.BooleanField(
        default=True,
        verbose_name="Performance-Monitoring aktiviert"
    )
    
    # API & Integration
    api_rate_limit_per_minute = models.IntegerField(
        default=100,
        verbose_name="API Rate Limit (pro Minute)"
    )
    api_key_expiry_days = models.IntegerField(
        default=365,
        verbose_name="API-Schlüssel Ablaufzeit (Tage)"
    )
    webhook_enabled = models.BooleanField(
        default=False,
        verbose_name="Webhooks aktiviert"
    )
    webhook_url = models.URLField(
        blank=True,
        verbose_name="Webhook-URL"
    )
    webhook_secret = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="Webhook-Geheimnis"
    )
    external_api_timeout_seconds = models.IntegerField(
        default=30,
        verbose_name="Externe API-Timeout (Sekunden)"
    )
    retry_failed_requests = models.BooleanField(
        default=True,
        verbose_name="Fehlgeschlagene Requests wiederholen"
    )
    
    # Benutzer-Management
    user_registration_approval_required = models.BooleanField(
        default=False,
        verbose_name="Benutzer-Registrierung muss genehmigt werden"
    )
    default_user_role = models.CharField(
        max_length=20,
        default='VIEWER',
        verbose_name="Standard-Benutzerrolle"
    )
    user_session_timeout_minutes = models.IntegerField(
        default=480,
        verbose_name="Benutzer-Session-Timeout (Minuten)"
    )
    allow_multiple_sessions = models.BooleanField(
        default=True,
        verbose_name="Mehrere Sessions erlauben"
    )
    force_password_change_on_first_login = models.BooleanField(
        default=True,
        verbose_name="Passwort-Änderung beim ersten Login erzwingen"
    )
    
    # Datenschutz & Compliance
    data_retention_days = models.IntegerField(
        default=2555,  # 7 Jahre
        verbose_name="Daten-Aufbewahrung (Tage)"
    )
    anonymize_old_data = models.BooleanField(
        default=True,
        verbose_name="Alte Daten anonymisieren"
    )
    consent_required = models.BooleanField(
        default=True,
        verbose_name="Einverständnis erforderlich"
    )
    privacy_policy_url = models.URLField(
        blank=True,
        verbose_name="Datenschutz-URL"
    )
    terms_of_service_url = models.URLField(
        blank=True,
        verbose_name="AGB-URL"
    )
    
    # Audit-Felder
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Erstellt am")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Aktualisiert am")
    
    class Meta:
        verbose_name = "Systemeinstellung"
        verbose_name_plural = "Systemeinstellungen"
    
    def __str__(self):
        return f"Systemeinstellungen - {self.company_name}"
    
    def save(self, *args, **kwargs):
        """Stellt sicher, dass nur eine Instanz existiert"""
        self.pk = 1
        super().save(*args, **kwargs)
    
    @classmethod
    def get_settings(cls):
        """Gibt die Systemeinstellungen zurück oder erstellt sie"""
        settings, created = cls.objects.get_or_create(pk=1)
        return settings