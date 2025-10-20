"""
LCREE Settings Serializers
===========================

Django REST Framework Serializers für die Settings-App.

Features:
- SystemSettingsSerializer für Systemeinstellungen
- Vollständige Validierung und Sicherheit
"""

from rest_framework import serializers
from .models import SystemSettings


class SystemSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer für Systemeinstellungen
    
    Serialisiert Systemeinstellungen als Singleton.
    """
    
    class Meta:
        model = SystemSettings
        fields = [
            'id', 'company_name', 'currency', 'qr_base_url', 'print_agent_url',
            'registration_enabled', 'require_email_verification', 'password_reset_token_expiry_hours',
            'default_loss_factor_oil_percent', 'require_second_batch_scan_on_insufficient',
            'show_older_batch_warning', 'analytics_defaults', 'scraper_settings',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_password_reset_token_expiry_hours(self, value):
        """Validiert Token-Gültigkeit"""
        if value < 1 or value > 168:  # 1 Stunde bis 1 Woche
            raise serializers.ValidationError("Token-Gültigkeit muss zwischen 1 und 168 Stunden liegen")
        return value
    
    def validate_default_loss_factor_oil_percent(self, value):
        """Validiert Verlustfaktor"""
        if value < 0 or value > 100:
            raise serializers.ValidationError("Verlustfaktor muss zwischen 0 und 100% liegen")
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
