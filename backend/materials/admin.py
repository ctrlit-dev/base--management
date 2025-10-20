"""
LCREE Materials Admin Configuration
==================================

Vollständige Django Admin-Konfiguration für die Materials-App.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Material, PackagingCompositionPart


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    """
    Materialverwaltung mit Kategorien und Bestandsverfolgung
    
    Bietet vollständige Verwaltung von Materialien mit:
    - Kategorie-basierte Organisation
    - Bestandsverfolgung mit Mindestbeständen
    - Kostenverfolgung pro Einheit
    - SKU/Barcode-Unterstützung
    """
    
    list_display = [
        'name', 'category', 'unit', 'stock_qty', 'min_qty', 
        'cost_per_unit', 'is_tracked', 'is_deleted', 'created_at'
    ]
    list_filter = [
        'category', 'unit', 'is_tracked', 'cost_included', 
        'is_deleted', 'created_at', 'updated_at'
    ]
    search_fields = [
        'name', 'sku_or_barcode', 'category'
    ]
    ordering = ['category', 'name']
    readonly_fields = ['created_at', 'updated_at', 'deleted_at']
    
    fieldsets = (
        ('Grunddaten', {
            'fields': ('name', 'category', 'unit')
        }),
        ('Bestand & Kosten', {
            'fields': ('stock_qty', 'min_qty', 'cost_per_unit', 'sku_or_barcode')
        }),
        ('Verfolgung', {
            'fields': ('is_tracked', 'cost_included'),
            'classes': ('collapse',)
        }),
        ('Soft-Delete', {
            'fields': ('is_deleted', 'deleted_at', 'deleted_by'),
            'classes': ('collapse',)
        }),
        ('Zeitstempel', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_tracked', 'mark_as_not_tracked', 'update_min_qty', 'soft_delete_materials']
    
    def mark_as_tracked(self, request, queryset):
        """Materialien als verfolgt markieren"""
        count = queryset.update(is_tracked=True)
        self.message_user(request, f'{count} Materialien wurden als verfolgt markiert.')
    mark_as_tracked.short_description = "Als verfolgt markieren"
    
    def mark_as_not_tracked(self, request, queryset):
        """Materialien als nicht verfolgt markieren"""
        count = queryset.update(is_tracked=False)
        self.message_user(request, f'{count} Materialien wurden als nicht verfolgt markiert.')
    mark_as_not_tracked.short_description = "Als nicht verfolgt markieren"
    
    def update_min_qty(self, request, queryset):
        """Mindestbestand aktualisieren"""
        count = queryset.update(min_qty=10)  # Beispielwert
        self.message_user(request, f'{count} Materialien haben neuen Mindestbestand erhalten.')
    update_min_qty.short_description = "Mindestbestand aktualisieren"
    
    def soft_delete_materials(self, request, queryset):
        """Soft-Delete für ausgewählte Materialien"""
        count = queryset.update(is_deleted=True, deleted_by=request.user)
        self.message_user(request, f'{count} Materialien wurden gelöscht.')
    soft_delete_materials.short_description = "Ausgewählte Materialien löschen"


@admin.register(PackagingCompositionPart)
class PackagingCompositionPartAdmin(admin.ModelAdmin):
    """
    Verpackungszusammensetzung-Verwaltung
    
    Verwaltet die Zusammensetzung von Verpackungen mit:
    - Parent-Child-Beziehungen
    - Mengen pro Parent-Verpackung
    - Automatische Einzelteil-Verfolgung
    """
    
    list_display = [
        'parent_material_name', 'part_material_name', 'qty_per_parent', 
        'created_at'
    ]
    list_filter = [
        'parent_material__category', 'part_material__category', 'created_at'
    ]
    search_fields = [
        'parent_material__name', 'part_material__name'
    ]
    ordering = ['parent_material__name', 'part_material__name']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Verpackungszusammensetzung', {
            'fields': ('parent_material', 'part_material', 'qty_per_parent')
        }),
        ('Zeitstempel', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def parent_material_name(self, obj):
        """Zeigt den Namen des Parent-Materials"""
        return obj.parent_material.name
    parent_material_name.short_description = 'Parent-Material'
    parent_material_name.admin_order_field = 'parent_material__name'
    
    def part_material_name(self, obj):
        """Zeigt den Namen des Teil-Materials"""
        return obj.part_material.name
    part_material_name.short_description = 'Teil-Material'
    part_material_name.admin_order_field = 'part_material__name'
