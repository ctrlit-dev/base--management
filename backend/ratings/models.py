"""
LCREE Ratings Models
====================

Bewertungen Verwaltung für das LCREE-System.

Features:
- Bewertungen für produzierte Artikel
- QR-Code-basierte Bewertungserstellung
- Moderation und Verifikation
- Öffentliche Produktseiten
- Soft-Delete für alle Bewertungsdaten
"""

from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator


class Rating(models.Model):
    """Bewertungs-Model für das LCREE-System"""
    
    produced_item = models.ForeignKey('production.ProducedItem', on_delete=models.CASCADE, related_name='ratings', verbose_name="Produzierter Artikel")
    fragrance = models.ForeignKey('fragrances.Fragrance', on_delete=models.CASCADE, verbose_name="Duft")
    container = models.ForeignKey('containers.Container', on_delete=models.CASCADE, verbose_name="Container")
    
    # Bewertungsdaten
    stars = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name="Sterne"
    )
    comment = models.TextField(null=True, blank=True, verbose_name="Kommentar")
    display_name = models.CharField(max_length=100, null=True, blank=True, verbose_name="Anzeigename")
    
    # Moderation
    verified = models.BooleanField(default=True, verbose_name="Verifiziert")
    is_public = models.BooleanField(default=True, verbose_name="Öffentlich")
    moderated = models.BooleanField(default=False, verbose_name="Moderiert")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Erstellt am")
    
    class Meta:
        verbose_name = "Bewertung"
        verbose_name_plural = "Bewertungen"
        ordering = ['-created_at']
        unique_together = ['produced_item']  # Nur eine Bewertung pro Artikel
    
    def __str__(self):
        return f"{self.stars} Sterne für {self.fragrance.name}"