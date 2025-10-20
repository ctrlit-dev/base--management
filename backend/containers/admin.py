"""
LCREE Containers Admin Configuration
====================================

Vollständige Django Admin-Konfiguration für die Containers-App.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Container, Recipe, RecipeComponent


class RecipeComponentInline(admin.TabularInline):
    """Inline-Verwaltung für Rezept-Komponenten"""
    model = RecipeComponent
    extra = 1
    fields = ['component_kind', 'material', 'qty_required', 'unit', 'is_optional']


@admin.register(Container)
class ContainerAdmin(admin.ModelAdmin):
    """
    Container-Verwaltung mit Typen und Preisen
    
    Bietet vollständige Verwaltung von Containern mit:
    - Container-Typen und Füllvolumen
    - Einzelhandelspreise und Barcode-Unterstützung
    - Verlustfaktor-Konfiguration
    - Soft-Delete-Funktionalität
    """
    
    list_display = [
        'name', 'type', 'fill_volume_ml', 'price_retail', 
        'loss_factor_oil_percent', 'active', 'is_deleted', 'created_at'
    ]
    list_filter = [
        'type', 'active', 'is_deleted', 'created_at', 'updated_at'
    ]
    search_fields = [
        'name', 'barcode', 'type'
    ]
    ordering = ['type', 'name']
    readonly_fields = ['created_at', 'updated_at', 'deleted_at']
    
    fieldsets = (
        ('Grunddaten', {
            'fields': ('name', 'type', 'fill_volume_ml')
        }),
        ('Preise & Barcode', {
            'fields': ('price_retail', 'barcode')
        }),
        ('Konfiguration', {
            'fields': ('loss_factor_oil_percent', 'active'),
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
    
    actions = ['activate_containers', 'deactivate_containers', 'soft_delete_containers']
    
    def activate_containers(self, request, queryset):
        """Container aktivieren"""
        count = queryset.update(active=True)
        self.message_user(request, f'{count} Container wurden aktiviert.')
    activate_containers.short_description = "Container aktivieren"
    
    def deactivate_containers(self, request, queryset):
        """Container deaktivieren"""
        count = queryset.update(active=False)
        self.message_user(request, f'{count} Container wurden deaktiviert.')
    deactivate_containers.short_description = "Container deaktivieren"
    
    def soft_delete_containers(self, request, queryset):
        """Soft-Delete für ausgewählte Container"""
        count = queryset.update(is_deleted=True, deleted_by=request.user)
        self.message_user(request, f'{count} Container wurden gelöscht.')
    soft_delete_containers.short_description = "Ausgewählte Container löschen"


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    """
    Rezept-Verwaltung mit Komponenten
    
    Verwaltet Rezepte mit:
    - Container-Zuordnung
    - Inline-Komponenten-Verwaltung
    - Notizen und Status
    """
    
    list_display = [
        'container_name', 'notes_short', 'active'
    ]
    list_filter = [
        'active', 'container__type'
    ]
    search_fields = [
        'container__name', 'notes'
    ]
    ordering = ['container__name']
    inlines = [RecipeComponentInline]
    
    fieldsets = (
        ('Rezept-Informationen', {
            'fields': ('container', 'notes', 'active')
        }),
    )
    
    actions = ['activate_recipes', 'deactivate_recipes']
    
    def container_name(self, obj):
        """Zeigt den Namen des Containers"""
        return obj.container.name
    container_name.short_description = 'Container'
    container_name.admin_order_field = 'container__name'
    
    def notes_short(self, obj):
        """Zeigt gekürzte Notizen"""
        return obj.notes[:50] + "..." if len(obj.notes) > 50 else obj.notes
    notes_short.short_description = 'Notizen'
    
    def activate_recipes(self, request, queryset):
        """Rezepte aktivieren"""
        count = queryset.update(active=True)
        self.message_user(request, f'{count} Rezepte wurden aktiviert.')
    activate_recipes.short_description = "Rezepte aktivieren"
    
    def deactivate_recipes(self, request, queryset):
        """Rezepte deaktivieren"""
        count = queryset.update(active=False)
        self.message_user(request, f'{count} Rezepte wurden deaktiviert.')
    deactivate_recipes.short_description = "Rezepte deaktivieren"


@admin.register(RecipeComponent)
class RecipeComponentAdmin(admin.ModelAdmin):
    """
    Rezept-Komponenten-Verwaltung
    
    Verwaltet einzelne Rezept-Komponenten mit:
    - Komponenten-Typen und Material-Zuordnung
    - Mengen und Einheiten
    - Optional-Flags
    """
    
    list_display = [
        'recipe_name', 'component_kind', 'material_name', 
        'qty_required', 'unit', 'is_optional'
    ]
    list_filter = [
        'component_kind', 'unit', 'is_optional', 'recipe__container__type'
    ]
    search_fields = [
        'recipe__container__name', 'material__name'
    ]
    ordering = ['recipe__container__name', 'component_kind']
    
    fieldsets = (
        ('Komponenten-Informationen', {
            'fields': ('recipe', 'component_kind', 'material')
        }),
        ('Mengen & Einheiten', {
            'fields': ('qty_required', 'unit', 'is_optional')
        }),
    )
    
    def recipe_name(self, obj):
        """Zeigt den Namen des Rezepts"""
        return obj.recipe.container.name
    recipe_name.short_description = 'Rezept'
    recipe_name.admin_order_field = 'recipe__container__name'
    
    def material_name(self, obj):
        """Zeigt den Namen des Materials"""
        return obj.material.name if obj.material else "Öl (Placeholder)"
    material_name.short_description = 'Material'
    material_name.admin_order_field = 'material__name'
