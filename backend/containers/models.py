"""
LCREE Containers Models
========================

Container und Rezepte Verwaltung für das LCREE-System.

Features:
- Container-Verwaltung mit Preisen und Verlustfaktoren
- Rezept-System mit Komponenten
- Barcode-Tracking für Container
- Soft-Delete für alle Container-Daten
- Integration mit Produktion
"""

from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class ContainerType(models.TextChoices):
    """Typen von Containern"""
    PARFUM = 'PARFUM', 'Parfum'
    ROOM_SPRAY = 'ROOM_SPRAY', 'Raumspray'
    COLONIA = 'COLONIA', 'Kolonya'
    CAR_SPRAY = 'CAR_SPRAY', 'Auto-Spray'
    OIL_PURE = 'OIL_PURE', 'Reines Öl'
    ACCESSORY = 'ACCESSORY', 'Zubehör'


class ComponentKind(models.TextChoices):
    """Arten von Rezept-Komponenten"""
    PLACEHOLDER_OIL = 'PLACEHOLDER_OIL', 'Platzhalter Öl'
    ALCOHOL = 'ALCOHOL', 'Alkohol'
    WATER = 'WATER', 'Wasser'
    FIXATEUR = 'FIXATEUR', 'Fixateur'
    PACKAGING_BOTTLE = 'PACKAGING_BOTTLE', 'Verpackung Flakon'
    PACKAGING_PART = 'PACKAGING_PART', 'Verpackung Teil'
    PACKAGING_LABEL = 'PACKAGING_LABEL', 'Verpackung Etikett'
    PACKAGING_BOX = 'PACKAGING_BOX', 'Verpackung Box'
    OTHER = 'OTHER', 'Sonstiges'


class Container(models.Model):
    """Container-Model für das LCREE-System"""
    
    name = models.CharField(max_length=100, verbose_name="Name")
    type = models.CharField(max_length=20, choices=ContainerType.choices, verbose_name="Typ")
    fill_volume_ml = models.PositiveIntegerField(verbose_name="Füllvolumen (ml)")
    barcode = models.CharField(max_length=100, unique=True, verbose_name="Barcode")
    price_retail = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Verkaufspreis")
    loss_factor_oil_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('2.0'),
        validators=[MinValueValidator(Decimal('0.0')), MaxValueValidator(Decimal('100.0'))],
        verbose_name="Verlustfaktor Öl (%)"
    )
    active = models.BooleanField(default=True, verbose_name="Aktiv")
    
    # Soft-Delete Felder
    is_deleted = models.BooleanField(default=False, verbose_name="Gelöscht")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="Gelöscht am")
    deleted_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Gelöscht von")
    
    # Audit-Felder
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Erstellt am")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Aktualisiert am")
    
    class Meta:
        verbose_name = "Container"
        verbose_name_plural = "Container"
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.fill_volume_ml}ml)"


class Recipe(models.Model):
    """Rezept-Model für Container"""
    
    container = models.ForeignKey(Container, on_delete=models.CASCADE, related_name='recipes', verbose_name="Container")
    notes = models.TextField(null=True, blank=True, verbose_name="Notizen")
    active = models.BooleanField(default=True, verbose_name="Aktiv")
    
    class Meta:
        verbose_name = "Rezept"
        verbose_name_plural = "Rezepte"
    
    def __str__(self):
        return f"Rezept für {self.container.name}"


class RecipeComponent(models.Model):
    """Rezept-Komponente"""
    
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='components', verbose_name="Rezept")
    component_kind = models.CharField(max_length=20, choices=ComponentKind.choices, verbose_name="Komponentenart")
    material = models.ForeignKey(
        'materials.Material',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="Material",
        help_text="Nur für PLACEHOLDER_OIL null"
    )
    qty_required = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Benötigte Menge")
    unit = models.CharField(max_length=10, choices=[('ML', 'Milliliter'), ('PCS', 'Stück')], verbose_name="Einheit")
    is_optional = models.BooleanField(default=False, verbose_name="Optional")
    
    class Meta:
        verbose_name = "Rezept-Komponente"
        verbose_name_plural = "Rezept-Komponenten"
    
    def __str__(self):
        return f"{self.component_kind}: {self.qty_required} {self.unit}"