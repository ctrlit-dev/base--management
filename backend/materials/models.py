"""
LCREE Materials Models
======================

Materialien und Verpackungen Verwaltung für das LCREE-System.

Features:
- Vollständige Materialverwaltung mit Kategorien
- Verpackungszusammensetzung-Tracking
- Kosten- und Bestandsverfolgung
- Soft-Delete für alle Materialdaten
- Integration mit Produktion und Bestellungen
"""

from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
from decimal import Decimal


class MaterialCategory(models.TextChoices):
    """Kategorien von Materialien"""
    ALCOHOL = 'ALCOHOL', 'Alkohol'
    FIXATEUR = 'FIXATEUR', 'Fixateur'
    WATER = 'WATER', 'Wasser'
    PACKAGING_BOTTLE = 'PACKAGING_BOTTLE', 'Verpackung Flakon'
    PACKAGING_PART = 'PACKAGING_PART', 'Verpackung Teil'
    PACKAGING_LABEL = 'PACKAGING_LABEL', 'Verpackung Etikett'
    PACKAGING_BOX = 'PACKAGING_BOX', 'Verpackung Box'
    OTHER = 'OTHER', 'Sonstiges'
    TOOL = 'TOOL', 'Werkzeug'


class MaterialUnit(models.TextChoices):
    """Einheiten für Materialien"""
    ML = 'ML', 'Milliliter'
    PCS = 'PCS', 'Stück'


class Material(models.Model):
    """Material-Model für das LCREE-System"""
    
    name = models.CharField(max_length=100, verbose_name="Name")
    category = models.CharField(max_length=20, choices=MaterialCategory.choices, verbose_name="Kategorie")
    unit = models.CharField(max_length=10, choices=MaterialUnit.choices, verbose_name="Einheit")
    stock_qty = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'), verbose_name="Bestand")
    min_qty = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'), verbose_name="Mindestbestand")
    cost_per_unit = models.DecimalField(max_digits=10, decimal_places=4, default=Decimal('0'), verbose_name="Kosten pro Einheit")
    sku_or_barcode = models.CharField(max_length=100, unique=True, null=True, blank=True, verbose_name="SKU/Barcode")
    is_tracked = models.BooleanField(default=True, verbose_name="Wird verfolgt")
    cost_included = models.BooleanField(default=True, verbose_name="Kosten enthalten")
    
    # Soft-Delete Felder
    is_deleted = models.BooleanField(default=False, verbose_name="Gelöscht")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="Gelöscht am")
    deleted_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Gelöscht von")
    
    # Audit-Felder
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Erstellt am")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Aktualisiert am")
    
    class Meta:
        verbose_name = "Material"
        verbose_name_plural = "Materialien"
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.category})"


class PackagingCompositionPart(models.Model):
    """Verpackungszusammensetzung für automatisches Einzelteil-Tracking"""
    
    parent_material = models.ForeignKey(
        Material,
        on_delete=models.CASCADE,
        related_name='composition_parts',
        verbose_name="Hauptmaterial",
        help_text="Material mit Kategorie PACKAGING_BOTTLE"
    )
    part_material = models.ForeignKey(
        Material,
        on_delete=models.CASCADE,
        related_name='used_in_compositions',
        verbose_name="Teil-Material"
    )
    qty_per_parent = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name="Menge pro Hauptmaterial"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Erstellt am")
    
    class Meta:
        verbose_name = "Verpackungszusammensetzung"
        verbose_name_plural = "Verpackungszusammensetzungen"
        unique_together = ['parent_material', 'part_material']
    
    def __str__(self):
        return f"{self.parent_material.name} enthält {self.qty_per_parent} {self.part_material.name}"