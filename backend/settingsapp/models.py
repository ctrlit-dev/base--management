"""
LCREE Settings Models
======================

Systemeinstellungen Verwaltung für das LCREE-System.

Features:
- Singleton-Pattern für Systemeinstellungen
- Konfigurierbare Parameter
- QR-Code und Print-Agent URLs
- Analytics und Scraper-Einstellungen
- Soft-Delete für alle Einstellungsdaten
"""

from django.db import models
from django.utils import timezone


class SystemSettings(models.Model):
    """Systemeinstellungen als Singleton"""
    
    # Grundlegende Einstellungen
    company_name = models.CharField(max_length=100, default='LCREE', verbose_name="Firmenname")
    currency = models.CharField(max_length=3, default='EUR', verbose_name="Währung")
    qr_base_url = models.URLField(verbose_name="QR-Code Basis-URL")
    print_agent_url = models.URLField(verbose_name="Print-Agent URL")

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
    
    # Produktionseinstellungen
    default_loss_factor_oil_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=2.0,
        verbose_name="Standard-Verlustfaktor Öl (%)"
    )
    require_second_batch_scan_on_insufficient = models.BooleanField(
        default=True,
        verbose_name="Zweite Charge-Scan bei unzureichender Menge erforderlich"
    )
    show_older_batch_warning = models.BooleanField(
        default=True,
        verbose_name="Warnung bei älteren Chargen anzeigen"
    )
    
    # Analytics-Einstellungen
    analytics_defaults = models.JSONField(
        default=dict,
        verbose_name="Analytics-Standardeinstellungen"
    )
    
    # Scraper-Einstellungen
    scraper_settings = models.JSONField(
        default=dict,
        verbose_name="Scraper-Einstellungen"
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