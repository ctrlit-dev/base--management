"""
LCREE Fragrances Admin Configuration
===================================

Vollständige Django Admin-Konfiguration für die Fragrances-App.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Fragrance, OilBatch


@admin.register(Fragrance)
class FragranceAdmin(admin.ModelAdmin):
    """
    Erweiterte Duftverwaltung mit Noten und Bildern
    
    Bietet vollständige Verwaltung von Düften mit:
    - Noten-Verwaltung (Top, Heart, Base)
    - Bild-Upload und -Anzeige
    - Soft-Delete-Funktionalität
    - Erweiterte Such- und Filterfunktionen
    """
    
    list_display = [
        'internal_code', 'official_name', 'brand', 'gender', 
        'family', 'is_deleted', 'created_at'
    ]
    list_filter = [
        'gender', 'family', 'is_deleted', 'created_at', 'updated_at'
    ]
    search_fields = [
        'internal_code', 'brand', 'name', 'official_name', 
        'family', 'top_notes', 'heart_notes', 'base_notes'
    ]
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at', 'deleted_at']
    
    fieldsets = (
        ('Grunddaten', {
            'fields': ('internal_code', 'brand', 'name', 'official_name', 'gender')
        }),
        ('Duftnoten', {
            'fields': ('family', 'top_notes', 'heart_notes', 'base_notes'),
            'classes': ('collapse',)
        }),
        ('Beschreibung & Medien', {
            'fields': ('description', 'hero_image', 'parfumo_url')
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
    
    actions = ['soft_delete_fragrances', 'restore_fragrances', 'duplicate_fragrances']
    
    def soft_delete_fragrances(self, request, queryset):
        """Soft-Delete für ausgewählte Düfte"""
        count = queryset.update(is_deleted=True, deleted_by=request.user)
        self.message_user(request, f'{count} Düfte wurden gelöscht.')
    soft_delete_fragrances.short_description = "Ausgewählte Düfte löschen"
    
    def restore_fragrances(self, request, queryset):
        """Wiederherstellung gelöschter Düfte"""
        count = queryset.filter(is_deleted=True).update(is_deleted=False, deleted_by=None)
        self.message_user(request, f'{count} Düfte wurden wiederhergestellt.')
    restore_fragrances.short_description = "Ausgewählte Düfte wiederherstellen"
    
    def duplicate_fragrances(self, request, queryset):
        """Duplikate von Düften erstellen"""
        count = 0
        for fragrance in queryset:
            fragrance.pk = None
            fragrance.internal_code = f"{fragrance.internal_code}_COPY"
            fragrance.name = f"{fragrance.name} (Kopie)"
            fragrance.official_name = f"{fragrance.official_name} (Kopie)"
            fragrance.save()
            count += 1
        self.message_user(request, f'{count} Düfte wurden dupliziert.')
    duplicate_fragrances.short_description = "Ausgewählte Düfte duplizieren"


@admin.register(OilBatch)
class OilBatchAdmin(admin.ModelAdmin):
    """
    Öl-Chargen-Verwaltung mit Barcode und Kostenverfolgung
    
    Verwaltet Öl-Chargen mit:
    - Barcode-Anzeige und -Verwaltung
    - Kostenverfolgung und Toleranz-Kontrolle
    - Status-Management
    - Kalibrierungs-Historie
    """
    
    list_display = [
        'barcode', 'fragrance_name', 'qty_ml', 'cost_per_ml', 
        'status', 'received_at', 'expiry_date', 'is_deleted'
    ]
    list_filter = [
        'status', 'is_deleted', 'received_at', 'expiry_date', 
        'last_verified_at', 'fragrance__gender'
    ]
    search_fields = [
        'barcode', 'fragrance__brand', 'fragrance__name', 
        'fragrance__official_name'
    ]
    ordering = ['-received_at']
    readonly_fields = [
        'created_at', 'updated_at', 'deleted_at', 'barcode'
    ]
    
    fieldsets = (
        ('Chargen-Informationen', {
            'fields': ('fragrance', 'barcode', 'qty_ml', 'status')
        }),
        ('Kosten', {
            'fields': ('cost_total', 'cost_per_ml', 'order_item')
        }),
        ('Toleranz & Kalibrierung', {
            'fields': (
                'theoretical_volume_ml', 'measured_volume_ml', 
                'tolerance_percent', 'last_verified_at'
            ),
            'classes': ('collapse',)
        }),
        ('Zeitstempel', {
            'fields': ('received_at', 'expiry_date', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
        ('Soft-Delete', {
            'fields': ('is_deleted', 'deleted_at', 'deleted_by'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_available', 'mark_as_locked', 'mark_as_exhausted', 'calibrate_batches']
    
    def fragrance_name(self, obj):
        """Zeigt den Namen des Dufts"""
        return obj.fragrance.official_name
    fragrance_name.short_description = 'Duft'
    fragrance_name.admin_order_field = 'fragrance__official_name'
    
    def mark_as_available(self, request, queryset):
        """Chargen als verfügbar markieren"""
        count = queryset.update(status='AVAILABLE')
        self.message_user(request, f'{count} Chargen wurden als verfügbar markiert.')
    mark_as_available.short_description = "Als verfügbar markieren"
    
    def mark_as_locked(self, request, queryset):
        """Chargen als gesperrt markieren"""
        count = queryset.update(status='LOCKED')
        self.message_user(request, f'{count} Chargen wurden als gesperrt markiert.')
    mark_as_locked.short_description = "Als gesperrt markieren"
    
    def mark_as_exhausted(self, request, queryset):
        """Chargen als erschöpft markieren"""
        count = queryset.update(status='EXHAUSTED')
        self.message_user(request, f'{count} Chargen wurden als erschöpft markiert.')
    mark_as_exhausted.short_description = "Als erschöpft markieren"
    
    def calibrate_batches(self, request, queryset):
        """Chargen zur Kalibrierung markieren"""
        count = queryset.update(last_verified_at=None)
        self.message_user(request, f'{count} Chargen wurden zur Kalibrierung markiert.')
    calibrate_batches.short_description = "Zur Kalibrierung markieren"
