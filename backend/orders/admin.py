"""
LCREE Orders Admin Configuration
=================================

Vollständige Django Admin-Konfiguration für die Orders-App.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    """Inline-Verwaltung für Bestellpositionen"""
    model = OrderItem
    extra = 1
    fields = ['target_type', 'target_id', 'qty', 'unit_cost', 'allocated_shipping', 'allocated_customs', 'effective_cost_per_unit']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """
    Bestellungsverwaltung mit Kosten und Lieferanten
    
    Bietet vollständige Verwaltung von Bestellungen mit:
    - Lieferanten-Informationen
    - Kostenaufschlüsselung (Warenwert, Versand, Zoll)
    - Wareneingangs-Status
    - Inline-Positionen-Verwaltung
    """
    
    list_display = [
        'supplier', 'currency', 'items_subtotal', 'shipping_cost', 
        'customs_cost', 'total_cost', 'ordered_at', 'received_at', 'created_at'
    ]
    list_filter = [
        'currency', 'ordered_at', 'received_at', 'created_at'
    ]
    search_fields = [
        'supplier', 'note'
    ]
    ordering = ['-created_at']
    readonly_fields = ['created_at']
    inlines = [OrderItemInline]
    
    fieldsets = (
        ('Lieferanten-Informationen', {
            'fields': ('supplier', 'currency')
        }),
        ('Kostenaufschlüsselung', {
            'fields': ('items_subtotal', 'shipping_cost', 'customs_cost', 'total_cost')
        }),
        ('Zeitstempel', {
            'fields': ('ordered_at', 'received_at', 'created_at')
        }),
        ('Notizen', {
            'fields': ('note',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_received', 'calculate_totals']
    
    def mark_as_received(self, request, queryset):
        """Bestellungen als eingegangen markieren"""
        from django.utils import timezone
        count = queryset.filter(received_at__isnull=True).update(received_at=timezone.now())
        self.message_user(request, f'{count} Bestellungen wurden als eingegangen markiert.')
    mark_as_received.short_description = "Als eingegangen markieren"
    
    def calculate_totals(self, request, queryset):
        """Gesamtkosten neu berechnen"""
        count = 0
        for order in queryset:
            items_total = sum(item.qty * item.unit_cost for item in order.items.all())
            order.items_subtotal = items_total
            order.total_cost = items_total + order.shipping_cost + order.customs_cost
            order.save()
            count += 1
        self.message_user(request, f'{count} Bestellungen wurden neu berechnet.')
    calculate_totals.short_description = "Gesamtkosten neu berechnen"


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    """
    Bestellpositionen-Verwaltung
    
    Verwaltet einzelne Bestellpositionen mit:
    - Target-Typ (MATERIAL/OILBATCH)
    - Mengen und Kosten
    - Allokation von Versand/Zoll
    """
    
    list_display = [
        'order_supplier', 'target_type', 'target_id', 'qty', 
        'unit_cost', 'effective_cost_per_unit', 'allocated_shipping', 'allocated_customs'
    ]
    list_filter = [
        'target_type', 'order__currency', 'order__ordered_at'
    ]
    search_fields = [
        'order__supplier', 'target_id'
    ]
    ordering = ['-order__created_at', 'target_type']
    
    fieldsets = (
        ('Bestellungs-Informationen', {
            'fields': ('order', 'target_type', 'target_id')
        }),
        ('Mengen & Kosten', {
            'fields': ('qty', 'unit_cost', 'effective_cost_per_unit')
        }),
        ('Allokation', {
            'fields': ('allocated_shipping', 'allocated_customs'),
            'classes': ('collapse',)
        }),
    )
    
    def order_supplier(self, obj):
        """Zeigt den Lieferanten der Bestellung"""
        return obj.order.supplier
    order_supplier.short_description = 'Lieferant'
    order_supplier.admin_order_field = 'order__supplier'
