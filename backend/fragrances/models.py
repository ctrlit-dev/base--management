"""
LCREE Fragrances Models
=======================

Düfte und Öl-Chargen Verwaltung für das LCREE-System.

Features:
- Vollständige Duftverwaltung mit Noten, Marken und Kategorien
- Öl-Chargen mit Barcode-Tracking und Kostenverfolgung
- Soft-Delete für alle Duftdaten
- Toleranz- und Kalibrierungsfunktionen
- Integration mit Produktion und Verkauf

Wichtige Konzepte:
- Interne Codes für Düfte (M-001, W-002, U-003)
- Barcode-basierte Öl-Chargen-Verfolgung
- Kostenberechnung pro ml
- Toleranz-Management für Produktion
- Geschlechtsspezifische Kategorisierung
"""

from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from decimal import Decimal
import uuid


class FragranceGender(models.TextChoices):
    """
    Geschlechtsspezifische Kategorisierung von Düften
    
    M: Männlich (Men)
    W: Weiblich (Women) 
    U: Unisex (Universal)
    """
    M = 'M', 'Männlich'
    W = 'W', 'Weiblich'
    U = 'U', 'Unisex'


class OilBatchStatus(models.TextChoices):
    """
    Status von Öl-Chargen
    
    AVAILABLE: Verfügbar für Produktion
    LOCKED: Gesperrt (z.B. während Produktion)
    EXHAUSTED: Aufgebraucht
    """
    AVAILABLE = 'AVAILABLE', 'Verfügbar'
    LOCKED = 'LOCKED', 'Gesperrt'
    EXHAUSTED = 'EXHAUSTED', 'Aufgebraucht'


class Fragrance(models.Model):
    """
    Duft-Model für das LCREE-System
    
    Speichert alle Informationen über einen Duft:
    - Interne Kodierung und Kategorisierung
    - Marken- und Produktinformationen
    - Duftnoten (Top, Heart, Base)
    - Bilder und externe Links
    - Soft-Delete Funktionalität
    """
    
    # Interne Kodierung (z.B. M-001, W-002, U-003)
    internal_code = models.CharField(
        max_length=20,
        unique=True,
        verbose_name="Interner Code",
        help_text="Eindeutige interne Kennung des Dufts (z.B. M-001)"
    )
    
    # Geschlechtsspezifische Kategorisierung
    gender = models.CharField(
        max_length=1,
        choices=FragranceGender.choices,
        verbose_name="Geschlecht",
        help_text="Geschlechtsspezifische Kategorisierung des Dufts"
    )
    
    # Marken- und Produktinformationen
    brand = models.CharField(
        max_length=100,
        verbose_name="Marke",
        help_text="Marke des Dufts"
    )
    name = models.CharField(
        max_length=100,
        verbose_name="Name",
        help_text="Name des Dufts"
    )
    official_name = models.CharField(
        max_length=200,
        verbose_name="Offizieller Name",
        help_text="Vollständiger offizieller Name (Marke - Produkt)"
    )
    
    # Duftfamilie und Noten
    family = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name="Duftfamilie",
        help_text="Duftfamilie (z.B. Orientalisch, Blumig, Holz)"
    )
    top_notes = models.JSONField(
        default=list,
        verbose_name="Kopfnoten",
        help_text="Liste der Kopfnoten"
    )
    heart_notes = models.JSONField(
        default=list,
        verbose_name="Herznoten",
        help_text="Liste der Herznoten"
    )
    base_notes = models.JSONField(
        default=list,
        verbose_name="Basisnoten",
        help_text="Liste der Basisnoten"
    )
    
    # Beschreibung und Medien
    description = models.TextField(
        null=True,
        blank=True,
        verbose_name="Beschreibung",
        help_text="Detaillierte Beschreibung des Dufts"
    )
    hero_image = models.ImageField(
        upload_to='fragrances/',
        null=True,
        blank=True,
        verbose_name="Hauptbild",
        help_text="Hauptbild des Dufts"
    )
    
    # Externe Links
    parfumo_url = models.URLField(
        null=True,
        blank=True,
        verbose_name="Parfumo-URL",
        help_text="Link zur Parfumo-Seite"
    )
    
    # Soft-Delete Felder
    is_deleted = models.BooleanField(
        default=False,
        verbose_name="Gelöscht",
        help_text="Markiert den Duft als gelöscht (Soft-Delete)"
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Gelöscht am",
        help_text="Zeitpunkt der Löschung"
    )
    deleted_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deleted_fragrances',
        verbose_name="Gelöscht von",
        help_text="Benutzer, der die Löschung durchgeführt hat"
    )
    
    # Audit-Felder
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Erstellt am"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Aktualisiert am"
    )
    
    class Meta:
        verbose_name = "Duft"
        verbose_name_plural = "Düfte"
        ordering = ['internal_code']
        indexes = [
            models.Index(fields=['internal_code']),
            models.Index(fields=['gender']),
            models.Index(fields=['brand']),
            models.Index(fields=['is_deleted']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        """String-Darstellung des Dufts"""
        return f"{self.internal_code} - {self.official_name}"
    
    def clean(self):
        """Validierung des Dufts"""
        super().clean()
        
        # Validiere interne Kodierung
        if self.internal_code:
            if not self.internal_code.startswith(self.gender):
                raise ValidationError(
                    f"Interner Code '{self.internal_code}' muss mit '{self.gender}' beginnen"
                )
    
    def soft_delete(self, deleted_by_user=None):
        """
        Soft-Delete des Dufts
        
        Args:
            deleted_by_user: Benutzer, der die Löschung durchführt
        """
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.deleted_by = deleted_by_user
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by'])
    
    def restore(self):
        """Wiederherstellung eines gelöschten Dufts"""
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by'])
    
    def get_available_batches(self):
        """Gibt alle verfügbaren Öl-Chargen für diesen Duft zurück"""
        return self.oil_batches.filter(
            status=OilBatchStatus.AVAILABLE,
            is_deleted=False
        ).order_by('received_at')
    
    def get_total_available_ml(self):
        """Berechnet die Gesamtmenge verfügbarer Öl-Chargen in ml"""
        batches = self.get_available_batches()
        return sum(batch.qty_ml for batch in batches)


class OilBatch(models.Model):
    """
    Öl-Charge für das LCREE-System
    
    Speichert alle Informationen über eine Öl-Charge:
    - Barcode-basierte Identifikation
    - Mengen- und Kostenverfolgung
    - Toleranz- und Kalibrierungsdaten
    - Status-Management
    - Soft-Delete Funktionalität
    """
    
    # Duft-Referenz
    fragrance = models.ForeignKey(
        Fragrance,
        on_delete=models.CASCADE,
        related_name='oil_batches',
        verbose_name="Duft",
        help_text="Duft, zu dem diese Öl-Charge gehört"
    )
    
    # Barcode-Identifikation
    barcode = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="Barcode",
        help_text="Eindeutiger Barcode der Öl-Charge"
    )
    
    # Mengenangaben
    qty_ml = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name="Menge (ml)",
        help_text="Verfügbare Menge in Millilitern"
    )
    
    # Kostenverfolgung
    cost_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name="Gesamtkosten",
        help_text="Gesamtkosten der Öl-Charge"
    )
    cost_per_ml = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        validators=[MinValueValidator(Decimal('0.0001'))],
        verbose_name="Kosten pro ml",
        help_text="Kosten pro Milliliter"
    )
    
    # Bestellreferenz (optional)
    order_item = models.ForeignKey(
        'orders.OrderItem',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='oil_batches',
        verbose_name="Bestellposition",
        help_text="Bestellposition, aus der diese Charge stammt"
    )
    
    # Zeitstempel
    received_at = models.DateTimeField(
        default=timezone.now,
        verbose_name="Eingegangen am",
        help_text="Zeitpunkt des Wareneingangs"
    )
    expiry_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Ablaufdatum",
        help_text="Ablaufdatum der Öl-Charge (optional)"
    )
    
    # Toleranz- und Kalibrierungsdaten
    theoretical_volume_ml = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name="Theoretisches Volumen (ml)",
        help_text="Theoretisches Volumen der Charge"
    )
    measured_volume_ml = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name="Gemessenes Volumen (ml)",
        help_text="Tatsächlich gemessenes Volumen (nach Kalibrierung)"
    )
    tolerance_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('3.0'),
        validators=[MinValueValidator(Decimal('0.0')), MaxValueValidator(Decimal('100.0'))],
        verbose_name="Toleranz (%)",
        help_text="Akzeptable Toleranz in Prozent"
    )
    last_verified_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Zuletzt verifiziert am",
        help_text="Zeitpunkt der letzten Kalibrierung"
    )
    
    # Status-Management
    status = models.CharField(
        max_length=20,
        choices=OilBatchStatus.choices,
        default=OilBatchStatus.AVAILABLE,
        verbose_name="Status",
        help_text="Aktueller Status der Öl-Charge"
    )
    
    # Soft-Delete Felder
    is_deleted = models.BooleanField(
        default=False,
        verbose_name="Gelöscht",
        help_text="Markiert die Öl-Charge als gelöscht (Soft-Delete)"
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Gelöscht am",
        help_text="Zeitpunkt der Löschung"
    )
    deleted_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deleted_oil_batches',
        verbose_name="Gelöscht von",
        help_text="Benutzer, der die Löschung durchgeführt hat"
    )
    
    # Audit-Felder
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Erstellt am"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Aktualisiert am"
    )
    
    class Meta:
        verbose_name = "Öl-Charge"
        verbose_name_plural = "Öl-Chargen"
        ordering = ['-received_at']
        indexes = [
            models.Index(fields=['barcode']),
            models.Index(fields=['fragrance']),
            models.Index(fields=['status']),
            models.Index(fields=['is_deleted']),
            models.Index(fields=['received_at']),
        ]
    
    def __str__(self):
        """String-Darstellung der Öl-Charge"""
        return f"{self.fragrance.internal_code} - {self.barcode} ({self.qty_ml}ml)"
    
    def clean(self):
        """Validierung der Öl-Charge"""
        super().clean()
        
        # Validiere Kostenberechnung
        if self.cost_total and self.qty_ml:
            expected_cost_per_ml = self.cost_total / self.qty_ml
            if abs(self.cost_per_ml - expected_cost_per_ml) > Decimal('0.0001'):
                raise ValidationError(
                    "Kosten pro ml müssen mit Gesamtkosten / Menge übereinstimmen"
                )
    
    def save(self, *args, **kwargs):
        """Speichert die Öl-Charge mit automatischer Kostenberechnung"""
        # Berechne Kosten pro ml automatisch
        if self.cost_total and self.qty_ml:
            self.cost_per_ml = self.cost_total / self.qty_ml
        
        super().save(*args, **kwargs)
    
    def soft_delete(self, deleted_by_user=None):
        """
        Soft-Delete der Öl-Charge
        
        Args:
            deleted_by_user: Benutzer, der die Löschung durchführt
        """
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.deleted_by = deleted_by_user
        self.status = OilBatchStatus.EXHAUSTED
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by', 'status'])
    
    def restore(self):
        """Wiederherstellung einer gelöschten Öl-Charge"""
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None
        self.status = OilBatchStatus.AVAILABLE
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by', 'status'])
    
    def calibrate(self, measured_volume_ml, verified_by_user=None):
        """
        Kalibriert die Öl-Charge mit gemessenem Volumen
        
        Args:
            measured_volume_ml: Gemessenes Volumen in ml
            verified_by_user: Benutzer, der die Kalibrierung durchführt
        """
        self.measured_volume_ml = measured_volume_ml
        self.last_verified_at = timezone.now()
        self.save(update_fields=['measured_volume_ml', 'last_verified_at'])
        
        # TODO: Audit-Log erstellen
    
    def get_tolerance_deviation(self):
        """Berechnet die Abweichung von der theoretischen Menge"""
        if not self.measured_volume_ml:
            return None
        
        deviation = abs(self.measured_volume_ml - self.theoretical_volume_ml)
        deviation_percent = (deviation / self.theoretical_volume_ml) * 100
        
        return {
            'deviation_ml': deviation,
            'deviation_percent': deviation_percent,
            'within_tolerance': deviation_percent <= self.tolerance_percent
        }
    
    def is_calibration_recommended(self):
        """Prüft, ob eine Kalibrierung empfohlen wird"""
        deviation = self.get_tolerance_deviation()
        if not deviation:
            return False
        
        return not deviation['within_tolerance']
    
    def consume(self, amount_ml):
        """
        Verbraucht eine bestimmte Menge der Öl-Charge
        
        Args:
            amount_ml: Zu verbrauchende Menge in ml
            
        Returns:
            bool: True wenn erfolgreich verbraucht
        """
        if self.status != OilBatchStatus.AVAILABLE:
            return False
        
        if amount_ml > self.qty_ml:
            return False
        
        self.qty_ml -= amount_ml
        
        if self.qty_ml <= Decimal('0'):
            self.status = OilBatchStatus.EXHAUSTED
        
        self.save(update_fields=['qty_ml', 'status'])
        return True
    
    def lock(self):
        """Sperrt die Öl-Charge für Produktion"""
        if self.status == OilBatchStatus.AVAILABLE:
            self.status = OilBatchStatus.LOCKED
            self.save(update_fields=['status'])
    
    def unlock(self):
        """Entsperrt die Öl-Charge"""
        if self.status == OilBatchStatus.LOCKED:
            self.status = OilBatchStatus.AVAILABLE
            self.save(update_fields=['status'])