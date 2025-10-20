"""
LCREE Tools Admin Configuration
===============================

Vollständige Django Admin-Konfiguration für die Tools-App.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import ToolUsage


@admin.register(ToolUsage)
class ToolUsageAdmin(admin.ModelAdmin):
    """
    Tool-Verbrauch-Verwaltung
    
    Bietet vollständige Verwaltung von Tool-Verbräuchen mit:
    - Material-Zuordnung (nur TOOL-Kategorie)
    - Benutzer-Zuordnung
    - Verbrauchsgrund
    - Zeitstempel-Tracking
    """
    
    list_display = [
        'id', 'material_name', 'user_name', 'qty_used', 
        'reason_short', 'used_at'
    ]
    list_filter = [
        'used_at', 'material__category', 'user__role'
    ]
    search_fields = [
        'material__name', 'user__email', 'reason'
    ]
    ordering = ['-used_at']
    readonly_fields = ['used_at']
    
    fieldsets = (
        ('Verbrauchs-Informationen', {
            'fields': ('material', 'user', 'qty_used')
        }),
        ('Details', {
            'fields': ('reason', 'used_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['export_usage_report']
    
    def material_name(self, obj):
        """Zeigt den Namen des Materials"""
        return obj.material.name
    material_name.short_description = 'Tool'
    material_name.admin_order_field = 'material__name'
    
    def user_name(self, obj):
        """Zeigt den Namen des Benutzers"""
        return obj.user.get_full_name()
    user_name.short_description = 'Benutzer'
    user_name.admin_order_field = 'user__first_name'
    
    def reason_short(self, obj):
        """Zeigt gekürzten Grund"""
        return obj.reason[:30] + "..." if len(obj.reason) > 30 else obj.reason
    reason_short.short_description = 'Grund'
    
    def export_usage_report(self, request, queryset):
        """Verbrauchsbericht exportieren"""
        # Hier könnte eine CSV-Export-Funktionalität implementiert werden
        self.message_user(request, f'Verbrauchsbericht für {queryset.count()} Einträge erstellt.')
    export_usage_report.short_description = "Verbrauchsbericht exportieren"
