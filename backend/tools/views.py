"""
LCREE Tools Views & Serializers
================================
"""

from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from django.utils import timezone
from .models import ToolUsage
from .serializers import ToolUsageSerializer
from materials.models import Material
from audit.models import AuditLog


class ToolUsageViewSet(viewsets.ModelViewSet):
    """ViewSet für Tool-Verbräuche"""
    queryset = ToolUsage.objects.all()
    serializer_class = ToolUsageSerializer


class ToolScanView(viewsets.ModelViewSet):
    """View für Tool-Scan"""
    
    def post(self, request):
        """
        Tool-Scan für Verbrauch außerhalb von Rezepten
        
        Implementiert die Tool-Verbrauchslogik:
        1. Material als TOOL prüfen
        2. Bestand reduzieren
        3. ToolUsage erfassen
        4. Audit-Log erstellen
        """
        data = request.data
        
        # Validierung der Eingabedaten
        required_fields = ['barcode', 'qty']
        for field in required_fields:
            if field not in data:
                return Response({
                    'error': f'Feld {field} ist erforderlich'
                }, status=400)
        
        try:
            with transaction.atomic():
                # Material als TOOL finden
                material = Material.objects.select_for_update().get(
                    sku_or_barcode=data['barcode'],
                    category='TOOL',
                    is_deleted=False
                )
                
                # Verfügbaren Bestand prüfen
                if material.stock_qty < data['qty']:
                    return Response({
                        'error': f'Nicht genügend {material.name} verfügbar. Benötigt: {data["qty"]}, Verfügbar: {material.stock_qty}'
                    }, status=400)
                
                # Bestand reduzieren
                material.stock_qty -= data['qty']
                material.save()
                
                # Tool-Verbrauch erfassen
                tool_usage = ToolUsage.objects.create(
                    material=material,
                    user=request.user,
                    qty_used=data['qty'],
                    reason=data.get('reason', ''),
                    used_at=timezone.now()
                )
                
                # Audit-Log erstellen
                AuditLog.objects.create(
                    actor=request.user,
                    action='TOOL_CHECKOUT',
                    subject_type='ToolUsage',
                    subject_id=tool_usage.id,
                    payload_before={'stock_qty': material.stock_qty + data['qty']},
                    payload_after={'stock_qty': material.stock_qty},
                    ip=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
                
                return Response({
                    'message': 'Tool-Verbrauch erfolgreich erfasst',
                    'tool_usage_id': tool_usage.id,
                    'material_name': material.name,
                    'qty_used': data['qty'],
                    'remaining_stock': material.stock_qty
                })
                
        except Material.DoesNotExist:
            return Response({
                'error': f'Tool mit Barcode {data["barcode"]} nicht gefunden oder ist kein Tool'
            }, status=404)
        except Exception as e:
            return Response({
                'error': f'Fehler beim Tool-Scan: {str(e)}'
            }, status=500)