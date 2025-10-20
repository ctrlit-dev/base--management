"""
LCREE Production Models
========================

Produktion und Verkauf Verwaltung für das LCREE-System.

Features:
- Produktionsverwaltung mit atomaren Transaktionen
- Sofortverkauf (kein Lager fertiger Ware)
- Komponentenverbrauch-Tracking
- QR-Code-Generierung für Produkte
- Soft-Delete für alle Produktionsdaten
"""

from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from decimal import Decimal
import uuid


class ProductionStatus(models.TextChoices):
    """Status von Produktionen"""
    DRAFT = 'DRAFT', 'Entwurf'
    READY = 'READY', 'Bereit'
    FAILED = 'FAILED', 'Fehlgeschlagen'
    DONE = 'DONE', 'Abgeschlossen'


class ProducedItemStatus(models.TextChoices):
    """Status von produzierten Artikeln"""
    SOLD = 'SOLD', 'Verkauft'


class Production(models.Model):
    """Produktions-Model für das LCREE-System"""
    
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, verbose_name="Benutzer")
    fragrance = models.ForeignKey('fragrances.Fragrance', on_delete=models.CASCADE, verbose_name="Duft")
    container = models.ForeignKey('containers.Container', on_delete=models.CASCADE, verbose_name="Container")
    qty = models.PositiveIntegerField(validators=[MinValueValidator(1)], verbose_name="Menge")
    status = models.CharField(max_length=20, choices=ProductionStatus.choices, default=ProductionStatus.DRAFT, verbose_name="Status")
    
    # Kostenverfolgung
    oil_cost_used = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'), verbose_name="Öl-Kosten verwendet")
    non_oil_cost_used = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'), verbose_name="Nicht-Öl-Kosten verwendet")
    total_production_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'), verbose_name="Gesamtproduktionskosten")
    loss_factor_oil_percent = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Verlustfaktor Öl (%)")
    
    # Zeitstempel
    started_at = models.DateTimeField(null=True, blank=True, verbose_name="Gestartet am")
    finished_at = models.DateTimeField(null=True, blank=True, verbose_name="Beendet am")
    failure_reason = models.TextField(null=True, blank=True, verbose_name="Fehlergrund")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Erstellt am")
    
    class Meta:
        verbose_name = "Produktion"
        verbose_name_plural = "Produktionen"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Produktion {self.id} - {self.fragrance.name}"


class ProductionComponentUsage(models.Model):
    """Komponentenverbrauch während der Produktion"""
    
    production = models.ForeignKey(Production, on_delete=models.CASCADE, related_name='component_usage', verbose_name="Produktion")
    component_ref = GenericForeignKey('content_type', 'object_id')
    content_type = models.ForeignKey('contenttypes.ContentType', on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    qty_used = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Verwendete Menge")
    unit = models.CharField(max_length=10, choices=[('ML', 'Milliliter'), ('PCS', 'Stück')], verbose_name="Einheit")
    before_stock = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Bestand vorher")
    after_stock = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Bestand nachher")
    unit_cost_at_use = models.DecimalField(max_digits=10, decimal_places=4, verbose_name="Einzelkosten bei Verwendung")
    cost_total_at_use = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Gesamtkosten bei Verwendung")
    
    class Meta:
        verbose_name = "Komponentenverbrauch"
        verbose_name_plural = "Komponentenverbräuche"
    
    def __str__(self):
        return f"{self.component_ref} - {self.qty_used} {self.unit}"


class ProducedItem(models.Model):
    """Produzierter Artikel"""
    
    production = models.ForeignKey(Production, on_delete=models.CASCADE, related_name='produced_items', verbose_name="Produktion")
    fragrance = models.ForeignKey('fragrances.Fragrance', on_delete=models.CASCADE, verbose_name="Duft")
    container = models.ForeignKey('containers.Container', on_delete=models.CASCADE, verbose_name="Container")
    status = models.CharField(max_length=20, choices=ProducedItemStatus.choices, default=ProducedItemStatus.SOLD, verbose_name="Status")
    
    # Kosten und Preise
    unit_cost_snapshot = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Einzelkosten-Snapshot")
    price_at_sale = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Preis beim Verkauf")
    
    # Identifikation
    serial = models.PositiveIntegerField(verbose_name="Seriennummer")
    uid = models.CharField(max_length=20, unique=True, verbose_name="UID")
    qr_code = models.URLField(verbose_name="QR-Code URL")
    
    # Zeitstempel
    produced_at = models.DateTimeField(default=timezone.now, verbose_name="Produziert am")
    sold_at = models.DateTimeField(default=timezone.now, verbose_name="Verkauft am")
    
    class Meta:
        verbose_name = "Produzierter Artikel"
        verbose_name_plural = "Produzierte Artikel"
        ordering = ['-produced_at']
    
    def __str__(self):
        return f"{self.fragrance.name} - {self.uid}"


class Sale(models.Model):
    """Verkaufs-Model"""
    
    container = models.ForeignKey('containers.Container', on_delete=models.CASCADE, verbose_name="Container")
    qty = models.PositiveIntegerField(verbose_name="Menge")
    price_total = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Gesamtpreis")
    cost_total = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Gesamtkosten")
    profit_total = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Gesamtgewinn")
    created_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE, verbose_name="Erstellt von")
    sold_at = models.DateTimeField(default=timezone.now, verbose_name="Verkauft am")
    
    class Meta:
        verbose_name = "Verkauf"
        verbose_name_plural = "Verkäufe"
        ordering = ['-sold_at']
    
    def __str__(self):
        return f"Verkauf {self.id} - {self.qty} Stück"