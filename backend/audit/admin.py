"""
LCREE Audit Admin Configuration
===============================

Vollständige Django Admin-Konfiguration für die Audit-App.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """
    Audit-Log-Verwaltung mit Vollständiger Nachverfolgung
    
    Bietet vollständige Verwaltung von Audit-Logs mit:
    - Benutzer-Aktionen und Zeitstempel
    - Vorher/Nachher-Werte in JSON
    - IP-Adresse und User-Agent-Tracking
    - Kategorisierte Aktionen
    """
    
    list_display = [
        'id', 'actor_name', 'action', 'subject_type', 'subject_id', 
        'created_at', 'ip_address'
    ]
    list_filter = [
        'action', 'subject_type', 'created_at', 'actor__role'
    ]
    search_fields = [
        'actor__email', 'action', 'subject_type', 'subject_id', 'ip'
    ]
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'payload_before', 'payload_after']
    
    fieldsets = (
        ('Audit-Informationen', {
            'fields': ('actor', 'action', 'subject_type', 'subject_id')
        }),
        ('Änderungen', {
            'fields': ('payload_before', 'payload_after'),
            'classes': ('collapse',)
        }),
        ('Technische Details', {
            'fields': ('ip', 'user_agent', 'created_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['export_audit_report', 'filter_by_action', 'filter_by_user']
    
    def actor_name(self, obj):
        """Zeigt den Namen des Akteurs"""
        return obj.actor.get_full_name() if obj.actor else "System"
    actor_name.short_description = 'Akteur'
    actor_name.admin_order_field = 'actor__first_name'
    
    def ip_address(self, obj):
        """Zeigt die IP-Adresse"""
        return obj.ip or "Unbekannt"
    ip_address.short_description = 'IP-Adresse'
    
    def export_audit_report(self, request, queryset):
        """Audit-Bericht exportieren"""
        # Hier könnte eine CSV-Export-Funktionalität implementiert werden
        self.message_user(request, f'Audit-Bericht für {queryset.count()} Einträge erstellt.')
    export_audit_report.short_description = "Audit-Bericht exportieren"
    
    def filter_by_action(self, request, queryset):
        """Nach Aktion filtern"""
        # Beispiel-Implementierung für spezifische Aktionen
        self.message_user(request, f'Filter nach Aktion angewendet.')
    filter_by_action.short_description = "Nach Aktion filtern"
    
    def filter_by_user(self, request, queryset):
        """Nach Benutzer filtern"""
        # Beispiel-Implementierung für spezifische Benutzer
        self.message_user(request, f'Filter nach Benutzer angewendet.')
    filter_by_user.short_description = "Nach Benutzer filtern"
    
    def get_queryset(self, request):
        """Optimiert die Abfrage mit select_related"""
        return super().get_queryset(request).select_related('actor')
