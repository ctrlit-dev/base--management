"""
LCREE Production Admin Configuration
===================================

Vollständige Django Admin-Konfiguration für die Production-App.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Production, ProducedItem, Sale, ProductionComponentUsage


class ProductionComponentUsageInline(admin.TabularInline):
    """Inline-Verwaltung für Komponentenverbrauch"""
    model = ProductionComponentUsage
    extra = 0
    readonly_fields = ['before_stock', 'after_stock', 'unit_cost_at_use', 'cost_total_at_use']
    fields = ['component_ref', 'qty_used', 'unit', 'before_stock', 'after_stock', 'unit_cost_at_use', 'cost_total_at_use']


class ProducedItemInline(admin.TabularInline):
    """Inline-Verwaltung für produzierte Artikel"""
    model = ProducedItem
    extra = 0
    readonly_fields = ['serial', 'uid', 'qr_code', 'produced_at', 'sold_at']
    fields = ['fragrance', 'container', 'status', 'unit_cost_snapshot', 'price_at_sale', 'serial', 'uid', 'qr_code', 'produced_at', 'sold_at']


@admin.register(Production)
class ProductionAdmin(admin.ModelAdmin):
    """
    Produktionsverwaltung mit Kosten und Status
    
    Bietet vollständige Verwaltung von Produktionen mit:
    - Benutzer- und Duft-Zuordnung
    - Kostenverfolgung (Öl, Material, Gesamt)
    - Status-Management
    - Inline-Komponenten und Artikel
    """
    
    list_display = [
        'id', 'user_name', 'fragrance_name', 'container_name', 
        'qty', 'status', 'total_production_cost', 'started_at', 'finished_at'
    ]
    list_filter = [
        'status', 'started_at', 'finished_at', 'user__role', 'fragrance__gender'
    ]
    search_fields = [
        'user__email', 'fragrance__name', 'container__name', 'failure_reason'
    ]
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'started_at', 'finished_at']
    inlines = [ProductionComponentUsageInline, ProducedItemInline]
    
    fieldsets = (
        ('Produktions-Informationen', {
            'fields': ('user', 'fragrance', 'container', 'qty', 'status')
        }),
        ('Kosten', {
            'fields': ('oil_cost_used', 'non_oil_cost_used', 'total_production_cost', 'loss_factor_oil_percent'),
            'classes': ('collapse',)
        }),
        ('Zeitstempel', {
            'fields': ('started_at', 'finished_at', 'created_at'),
            'classes': ('collapse',)
        }),
        ('Fehlerbehandlung', {
            'fields': ('failure_reason',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_ready', 'mark_as_done', 'mark_as_failed']
    
    def user_name(self, obj):
        """Zeigt den Namen des Benutzers"""
        return obj.user.get_full_name()
    user_name.short_description = 'Benutzer'
    user_name.admin_order_field = 'user__first_name'
    
    def fragrance_name(self, obj):
        """Zeigt den Namen des Dufts"""
        return obj.fragrance.official_name
    fragrance_name.short_description = 'Duft'
    fragrance_name.admin_order_field = 'fragrance__official_name'
    
    def container_name(self, obj):
        """Zeigt den Namen des Containers"""
        return obj.container.name
    container_name.short_description = 'Container'
    container_name.admin_order_field = 'container__name'
    
    def mark_as_ready(self, request, queryset):
        """Produktionen als bereit markieren"""
        count = queryset.update(status='READY')
        self.message_user(request, f'{count} Produktionen wurden als bereit markiert.')
    mark_as_ready.short_description = "Als bereit markieren"
    
    def mark_as_done(self, request, queryset):
        """Produktionen als abgeschlossen markieren"""
        from django.utils import timezone
        count = queryset.update(status='DONE', finished_at=timezone.now())
        self.message_user(request, f'{count} Produktionen wurden als abgeschlossen markiert.')
    mark_as_done.short_description = "Als abgeschlossen markieren"
    
    def mark_as_failed(self, request, queryset):
        """Produktionen als fehlgeschlagen markieren"""
        count = queryset.update(status='FAILED')
        self.message_user(request, f'{count} Produktionen wurden als fehlgeschlagen markiert.')
    mark_as_failed.short_description = "Als fehlgeschlagen markieren"


@admin.register(ProducedItem)
class ProducedItemAdmin(admin.ModelAdmin):
    """
    Produzierte Artikel-Verwaltung mit QR-Codes
    
    Verwaltet produzierte Artikel mit:
    - Eindeutige UID und QR-Code-Generierung
    - Kosten-Snapshots und Verkaufspreise
    - Status-Tracking
    """
    
    list_display = [
        'uid', 'fragrance_name', 'container_name', 'status', 
        'unit_cost_snapshot', 'price_at_sale', 'produced_at', 'sold_at'
    ]
    list_filter = [
        'status', 'produced_at', 'sold_at', 'fragrance__gender', 'container__type'
    ]
    search_fields = [
        'uid', 'serial', 'fragrance__name', 'container__name'
    ]
    ordering = ['-produced_at']
    readonly_fields = ['serial', 'uid', 'qr_code', 'produced_at', 'sold_at']
    
    fieldsets = (
        ('Artikel-Informationen', {
            'fields': ('production', 'fragrance', 'container', 'status')
        }),
        ('Identifikation', {
            'fields': ('serial', 'uid', 'qr_code'),
            'classes': ('collapse',)
        }),
        ('Kosten & Preise', {
            'fields': ('unit_cost_snapshot', 'price_at_sale')
        }),
        ('Zeitstempel', {
            'fields': ('produced_at', 'sold_at'),
            'classes': ('collapse',)
        }),
    )
    
    def fragrance_name(self, obj):
        """Zeigt den Namen des Dufts"""
        return obj.fragrance.official_name
    fragrance_name.short_description = 'Duft'
    fragrance_name.admin_order_field = 'fragrance__official_name'
    
    def container_name(self, obj):
        """Zeigt den Namen des Containers"""
        return obj.container.name
    container_name.short_description = 'Container'
    container_name.admin_order_field = 'container__name'


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    """
    Verkaufsverwaltung mit Gewinnberechnung
    
    Verwaltet Verkäufe mit:
    - Container-Zuordnung und Mengen
    - Kosten- und Gewinnberechnung
    - Benutzer-Zuordnung
    """
    
    list_display = [
        'id', 'container_name', 'qty', 'price_total', 
        'cost_total', 'profit_total', 'created_by_name', 'sold_at'
    ]
    list_filter = [
        'sold_at', 'container__type', 'created_by__role'
    ]
    search_fields = [
        'container__name', 'created_by__email'
    ]
    ordering = ['-sold_at']
    readonly_fields = ['sold_at']
    
    fieldsets = (
        ('Verkaufs-Informationen', {
            'fields': ('container', 'qty', 'created_by')
        }),
        ('Finanzielle Details', {
            'fields': ('price_total', 'cost_total', 'profit_total')
        }),
        ('Zeitstempel', {
            'fields': ('sold_at',),
            'classes': ('collapse',)
        }),
    )
    
    def container_name(self, obj):
        """Zeigt den Namen des Containers"""
        return obj.container.name
    container_name.short_description = 'Container'
    container_name.admin_order_field = 'container__name'
    
    def created_by_name(self, obj):
        """Zeigt den Namen des Erstellers"""
        return obj.created_by.get_full_name()
    created_by_name.short_description = 'Erstellt von'
    created_by_name.admin_order_field = 'created_by__first_name'


@admin.register(ProductionComponentUsage)
class ProductionComponentUsageAdmin(admin.ModelAdmin):
    """
    Komponentenverbrauch-Verwaltung
    
    Verwaltet Komponentenverbrauch mit:
    - Vorher/Nachher-Bestand
    - Kostenverfolgung
    - Komponenten-Referenz
    """
    
    list_display = [
        'production_id', 'component_ref', 'qty_used', 'unit', 
        'before_stock', 'after_stock', 'cost_total_at_use'
    ]
    list_filter = [
        'unit', 'production__status', 'production__started_at'
    ]
    search_fields = [
        'production__id', 'component_ref'
    ]
    ordering = ['-production__created_at']
    
    fieldsets = (
        ('Verbrauchs-Informationen', {
            'fields': ('production', 'component_ref', 'qty_used', 'unit')
        }),
        ('Bestand & Kosten', {
            'fields': ('before_stock', 'after_stock', 'unit_cost_at_use', 'cost_total_at_use')
        }),
    )
    
    def production_id(self, obj):
        """Zeigt die ID der Produktion"""
        return f"#{obj.production.id}"
    production_id.short_description = 'Produktion'
    production_id.admin_order_field = 'production__id'
