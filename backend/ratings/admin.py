"""
LCREE Ratings Admin Configuration
=================================

Vollständige Django Admin-Konfiguration für die Ratings-App.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Rating


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    """
    Bewertungsverwaltung mit Moderation
    
    Bietet vollständige Verwaltung von Bewertungen mit:
    - Sterne-Bewertungen und Kommentare
    - Moderation und Verifizierung
    - Anonyme Bewertungen
    - Produkt-Zuordnung
    """
    
    list_display = [
        'id', 'produced_item_uid', 'fragrance_name', 'container_name', 
        'stars', 'display_name', 'verified', 'is_public', 'moderated', 'created_at'
    ]
    list_filter = [
        'stars', 'verified', 'is_public', 'moderated', 'created_at', 'fragrance__gender'
    ]
    search_fields = [
        'produced_item__uid', 'fragrance__name', 'container__name', 
        'display_name', 'comment'
    ]
    ordering = ['-created_at']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Bewertungs-Informationen', {
            'fields': ('produced_item', 'fragrance', 'container')
        }),
        ('Bewertung', {
            'fields': ('stars', 'comment', 'display_name')
        }),
        ('Moderation', {
            'fields': ('verified', 'is_public', 'moderated'),
            'classes': ('collapse',)
        }),
        ('Zeitstempel', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['verify_ratings', 'unverify_ratings', 'moderate_ratings', 'make_public', 'make_private']
    
    def produced_item_uid(self, obj):
        """Zeigt die UID des produzierten Artikels"""
        return obj.produced_item.uid
    produced_item_uid.short_description = 'Artikel-UID'
    produced_item_uid.admin_order_field = 'produced_item__uid'
    
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
    
    def verify_ratings(self, request, queryset):
        """Bewertungen verifizieren"""
        count = queryset.update(verified=True)
        self.message_user(request, f'{count} Bewertungen wurden verifiziert.')
    verify_ratings.short_description = "Bewertungen verifizieren"
    
    def unverify_ratings(self, request, queryset):
        """Bewertungen nicht verifizieren"""
        count = queryset.update(verified=False)
        self.message_user(request, f'{count} Bewertungen wurden nicht verifiziert.')
    unverify_ratings.short_description = "Bewertungen nicht verifizieren"
    
    def moderate_ratings(self, request, queryset):
        """Bewertungen moderieren"""
        count = queryset.update(moderated=True)
        self.message_user(request, f'{count} Bewertungen wurden moderiert.')
    moderate_ratings.short_description = "Bewertungen moderieren"
    
    def make_public(self, request, queryset):
        """Bewertungen öffentlich machen"""
        count = queryset.update(is_public=True)
        self.message_user(request, f'{count} Bewertungen wurden öffentlich gemacht.')
    make_public.short_description = "Öffentlich machen"
    
    def make_private(self, request, queryset):
        """Bewertungen privat machen"""
        count = queryset.update(is_public=False)
        self.message_user(request, f'{count} Bewertungen wurden privat gemacht.')
    make_private.short_description = "Privat machen"
