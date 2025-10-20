"""
LCREE Orders Models
===================

Bestellungen und Wareneingang Verwaltung für das LCREE-System.

Features:
- Bestellungsverwaltung mit Lieferanten
- Wareneingang mit proportionaler Kostenallokation
- Integration mit Materialien und Öl-Chargen
- Soft-Delete für alle Bestelldaten
- Audit-Trail für alle Transaktionen
"""

from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
from decimal import Decimal


class Order(models.Model):
    """Bestellungs-Model für das LCREE-System"""
    
    supplier = models.CharField(max_length=100, verbose_name="Lieferant")
    currency = models.CharField(max_length=3, default='EUR', verbose_name="Währung")
    items_subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'), verbose_name="Zwischensumme")
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'), verbose_name="Versandkosten")
    customs_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'), verbose_name="Zollkosten")
    total_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'), verbose_name="Gesamtkosten")
    note = models.TextField(null=True, blank=True, verbose_name="Notiz")
    ordered_at = models.DateTimeField(default=timezone.now, verbose_name="Bestellt am")
    received_at = models.DateTimeField(null=True, blank=True, verbose_name="Eingegangen am")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Erstellt am")
    
    class Meta:
        verbose_name = "Bestellung"
        verbose_name_plural = "Bestellungen"
        ordering = ['-ordered_at']
    
    def __str__(self):
        return f"Bestellung {self.id} - {self.supplier}"


class OrderItem(models.Model):
    """Bestellposition"""
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items', verbose_name="Bestellung")
    target_type = models.CharField(max_length=20, choices=[('MATERIAL', 'Material'), ('OILBATCH', 'Öl-Charge')], verbose_name="Zieltyp")
    target_id = models.PositiveIntegerField(verbose_name="Ziel-ID")
    qty = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], verbose_name="Menge")
    unit_cost = models.DecimalField(max_digits=10, decimal_places=4, verbose_name="Einzelkosten")
    allocated_shipping = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'), verbose_name="Zugewiesener Versand")
    allocated_customs = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'), verbose_name="Zugewiesener Zoll")
    effective_cost_per_unit = models.DecimalField(max_digits=10, decimal_places=4, verbose_name="Effektive Kosten pro Einheit")
    
    class Meta:
        verbose_name = "Bestellposition"
        verbose_name_plural = "Bestellpositionen"
    
    def __str__(self):
        return f"{self.target_type} - {self.qty} Einheiten"