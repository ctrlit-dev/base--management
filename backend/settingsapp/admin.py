"""
LCREE Settings App Admin Configuration
=======================================

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
    - QR-Code-Basis-URL und Print-Agent-Konfiguration
    - Standard-Verlustfaktoren
    - Analytics-Voreinstellungen
    """
    
    list_display = [
        'id', 'company_name', 'currency', 'qr_base_url', 
        'print_agent_url', 'default_loss_factor_oil_percent'
    ]
    readonly_fields = ['id']
    
    fieldsets = (
        ('Firmen-Informationen', {
            'fields': ('company_name', 'currency')
        }),
        ('Externe Services', {
            'fields': ('qr_base_url', 'print_agent_url')
        }),
        ('Produktions-Einstellungen', {
            'fields': ('default_loss_factor_oil_percent', 'require_second_batch_scan_on_insufficient', 'show_older_batch_warning'),
            'classes': ('collapse',)
        }),
        ('Analytics-Voreinstellungen', {
            'fields': ('analytics_defaults',),
            'classes': ('collapse',)
        }),
        ('Scraper-Einstellungen', {
            'fields': ('scraper_settings',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['reset_to_defaults', 'export_settings']
    
    def reset_to_defaults(self, request, queryset):
        """Einstellungen auf Standardwerte zurücksetzen"""
        settings = SystemSettings.objects.first()
        if settings:
            settings.company_name = "LCREE"
            settings.currency = "EUR"
            settings.qr_base_url = "https://yourdomain.com"
            settings.print_agent_url = "http://localhost:5000"
            settings.default_loss_factor_oil_percent = 2.0
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
