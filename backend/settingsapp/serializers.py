"""
User Management Settings Serializers
=====================================

Django REST Framework Serializers für die Settings-App.

Features:
- SystemSettingsSerializer für Systemeinstellungen
- Vollständige Validierung und Sicherheit
- Alle neuen Admin-Features unterstützt
"""

from rest_framework import serializers
from .models import SystemSettings


class SystemSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer für Systemeinstellungen
    
    Serialisiert Systemeinstellungen als Singleton mit allen Admin-Features.
    """
    
    class Meta:
        model = SystemSettings
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_password_reset_token_expiry_hours(self, value):
        """Validiert Token-Gültigkeit"""
        if value < 1 or value > 168:  # 1 Stunde bis 1 Woche
            raise serializers.ValidationError("Token-Gültigkeit muss zwischen 1 und 168 Stunden liegen")
        return value
    
    def validate_session_timeout_minutes(self, value):
        """Validiert Session-Timeout"""
        if value < 5 or value > 1440:  # 5 Minuten bis 24 Stunden
            raise serializers.ValidationError("Session-Timeout muss zwischen 5 und 1440 Minuten liegen")
        return value
    
    def validate_max_login_attempts(self, value):
        """Validiert maximale Login-Versuche"""
        if value < 1 or value > 20:
            raise serializers.ValidationError("Maximale Login-Versuche muss zwischen 1 und 20 liegen")
        return value
    
    def validate_password_min_length(self, value):
        """Validiert Mindestlänge Passwort"""
        if value < 6 or value > 50:
            raise serializers.ValidationError("Mindestlänge Passwort muss zwischen 6 und 50 Zeichen liegen")
        return value
    
    def validate_account_lockout_duration_minutes(self, value):
        """Validiert Account-Sperrung Dauer"""
        if value < 1 or value > 1440:  # 1 Minute bis 24 Stunden
            raise serializers.ValidationError("Account-Sperrung Dauer muss zwischen 1 und 1440 Minuten liegen")
        return value
    
    def validate_smtp_port(self, value):
        """Validiert SMTP-Port"""
        if value < 1 or value > 65535:
            raise serializers.ValidationError("SMTP-Port muss zwischen 1 und 65535 liegen")
        return value
    
    def validate_backup_frequency_hours(self, value):
        """Validiert Backup-Häufigkeit"""
        if value < 1 or value > 168:  # 1 Stunde bis 1 Woche
            raise serializers.ValidationError("Backup-Häufigkeit muss zwischen 1 und 168 Stunden liegen")
        return value
    
    def validate_backup_retention_days(self, value):
        """Validiert Backup-Aufbewahrung"""
        if value < 1 or value > 3650:  # 1 Tag bis 10 Jahre
            raise serializers.ValidationError("Backup-Aufbewahrung muss zwischen 1 und 3650 Tagen liegen")
        return value
    
    def validate_log_retention_days(self, value):
        """Validiert Log-Aufbewahrung"""
        if value < 1 or value > 3650:  # 1 Tag bis 10 Jahre
            raise serializers.ValidationError("Log-Aufbewahrung muss zwischen 1 und 3650 Tagen liegen")
        return value
    
    def validate_api_rate_limit_per_minute(self, value):
        """Validiert API Rate Limit"""
        if value < 1 or value > 10000:
            raise serializers.ValidationError("API Rate Limit muss zwischen 1 und 10000 pro Minute liegen")
        return value
    
    def validate_api_key_expiry_days(self, value):
        """Validiert API-Schlüssel Ablaufzeit"""
        if value < 1 or value > 3650:  # 1 Tag bis 10 Jahre
            raise serializers.ValidationError("API-Schlüssel Ablaufzeit muss zwischen 1 und 3650 Tagen liegen")
        return value
    
    def validate_external_api_timeout_seconds(self, value):
        """Validiert externe API-Timeout"""
        if value < 1 or value > 300:  # 1 Sekunde bis 5 Minuten
            raise serializers.ValidationError("Externe API-Timeout muss zwischen 1 und 300 Sekunden liegen")
        return value
    
    def validate_user_session_timeout_minutes(self, value):
        """Validiert Benutzer-Session-Timeout"""
        if value < 5 or value > 10080:  # 5 Minuten bis 1 Woche
            raise serializers.ValidationError("Benutzer-Session-Timeout muss zwischen 5 und 10080 Minuten liegen")
        return value
    
    def validate_data_retention_days(self, value):
        """Validiert Daten-Aufbewahrung"""
        if value < 1 or value > 3650:  # 1 Tag bis 10 Jahre
            raise serializers.ValidationError("Daten-Aufbewahrung muss zwischen 1 und 3650 Tagen liegen")
        return value
    
    def validate_company_name(self, value):
        """Validiert Firmenname"""
        if not value or not value.strip():
            raise serializers.ValidationError("Firmenname ist erforderlich")
        return value.strip()
    
    def validate_currency(self, value):
        """Validiert Währung"""
        valid_currencies = ['EUR', 'USD', 'GBP', 'CHF']
        if value not in valid_currencies:
            raise serializers.ValidationError(f"Währung muss einer der folgenden sein: {', '.join(valid_currencies)}")
        return value
    
    def validate_default_user_role(self, value):
        """Validiert Standard-Benutzerrolle"""
        valid_roles = ['ADMIN', 'PRODUCTION', 'WAREHOUSE', 'SALES', 'VIEWER']
        if value not in valid_roles:
            raise serializers.ValidationError(f"Standard-Benutzerrolle muss einer der folgenden sein: {', '.join(valid_roles)}")
        return value
