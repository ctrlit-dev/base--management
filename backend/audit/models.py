"""
LCREE Audit Models
==================

Audit-Log Verwaltung für das LCREE-System.

Features:
- Vollständige Nachverfolgung aller Aktionen
- Vorher/Nachher-Werte für Mutationen
- IP-Adresse und User-Agent Tracking
- Kategorisierte Aktionen
- Soft-Delete für alle Audit-Daten
"""

from django.db import models
from django.utils import timezone


class AuditAction(models.TextChoices):
    """Kategorien von Audit-Aktionen"""
    AUTH_LOGIN = 'AUTH_LOGIN', 'Anmeldung'
    AUTH_LOGOUT = 'AUTH_LOGOUT', 'Abmeldung'
    AUTH_PASSKEY_REGISTER = 'AUTH_PASSKEY_REGISTER', 'Passkey registriert'
    AUTH_PASSKEY_DELETE = 'AUTH_PASSKEY_DELETE', 'Passkey gelöscht'
    ORDER_RECEIVE = 'ORDER_RECEIVE', 'Wareneingang'
    PRODUCT_ADJUST = 'PRODUCT_ADJUST', 'Produkt-Anpassung'
    MATERIAL_ADJUST = 'MATERIAL_ADJUST', 'Material-Anpassung'
    BATCH_ADJUSTMENT = 'BATCH_ADJUSTMENT', 'Charge-Anpassung'
    PRODUCTION_COMMIT = 'PRODUCTION_COMMIT', 'Produktion bestätigt'
    SALE_COMMIT = 'SALE_COMMIT', 'Verkauf bestätigt'
    TOOL_CHECKOUT = 'TOOL_CHECKOUT', 'Tool-Entnahme'
    LABEL_PRINT_JOB = 'LABEL_PRINT_JOB', 'Etikettendruck'
    CRUD_CREATE = 'CRUD_CREATE', 'Erstellt'
    CRUD_UPDATE = 'CRUD_UPDATE', 'Aktualisiert'
    CRUD_DELETE = 'CRUD_DELETE', 'Gelöscht'
    # Benutzer-Management
    USER_SOFT_DELETE = 'USER_SOFT_DELETE', 'Benutzer Soft-Delete'
    USER_HARD_DELETE = 'USER_HARD_DELETE', 'Benutzer Hard-Delete'
    USER_RESTORE = 'USER_RESTORE', 'Benutzer wiederhergestellt'
    USER_CREATE = 'USER_CREATE', 'Benutzer erstellt'
    USER_UPDATE = 'USER_UPDATE', 'Benutzer aktualisiert'
    USER_STATUS_TOGGLE = 'USER_STATUS_TOGGLE', 'Benutzer-Status geändert'


class AuditLog(models.Model):
    """Audit-Log-Model für das LCREE-System"""
    
    actor = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Akteur")
    action = models.CharField(max_length=30, choices=AuditAction.choices, verbose_name="Aktion")
    subject_type = models.CharField(max_length=100, null=True, blank=True, verbose_name="Objekttyp")
    subject_id = models.PositiveIntegerField(null=True, blank=True, verbose_name="Objekt-ID")
    payload_before = models.JSONField(null=True, blank=True, verbose_name="Daten vorher")
    payload_after = models.JSONField(null=True, blank=True, verbose_name="Daten nachher")
    description = models.TextField(null=True, blank=True, verbose_name="Beschreibung")
    ip = models.GenericIPAddressField(null=True, blank=True, verbose_name="IP-Adresse")
    user_agent = models.TextField(null=True, blank=True, verbose_name="User-Agent")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Erstellt am")
    
    class Meta:
        verbose_name = "Audit-Log"
        verbose_name_plural = "Audit-Logs"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['actor']),
            models.Index(fields=['action']),
            models.Index(fields=['subject_type', 'subject_id']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.action} - {self.created_at.strftime('%d.%m.%Y %H:%M')}"