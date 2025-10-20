"""
LCREE Tools Models
==================

Tools und Verbrauch Verwaltung für das LCREE-System.

Features:
- Tool-Verbrauch außerhalb von Rezepten
- Barcode-basierte Tool-Entnahme
- Grund-Tracking für Werkzeuge
- Soft-Delete für alle Tool-Daten
"""

from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
from decimal import Decimal


class ToolUsage(models.Model):
    """Tool-Verbrauch außerhalb von Rezepten"""
    
    material = models.ForeignKey(
        'materials.Material',
        on_delete=models.CASCADE,
        related_name='tool_usages',
        verbose_name="Material",
        help_text="Material mit Kategorie TOOL"
    )
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, verbose_name="Benutzer")
    qty_used = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name="Verwendete Menge"
    )
    reason = models.TextField(null=True, blank=True, verbose_name="Grund")
    used_at = models.DateTimeField(default=timezone.now, verbose_name="Verwendet am")
    
    class Meta:
        verbose_name = "Tool-Verbrauch"
        verbose_name_plural = "Tool-Verbräuche"
        ordering = ['-used_at']
    
    def __str__(self):
        return f"{self.material.name} - {self.qty_used} verwendet"