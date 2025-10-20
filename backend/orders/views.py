"""
LCREE Orders Views & Serializers
=================================
"""

from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from django.utils import timezone
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderItemSerializer
from fragrances.models import OilBatch
from materials.models import Material
from audit.models import AuditLog


class OrderViewSet(viewsets.ModelViewSet):
    """ViewSet für Bestellungen"""
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    
    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        """
        Wareneingang für eine Bestellung
        
        Implementiert die komplette Wareneingangslogik:
        1. Proportionale Allokation von Versand/Zoll auf Positionen
        2. MATERIAL: Stock-Update und Kostenberechnung
        3. OILBATCH: Neue Öl-Charge erstellen
        4. Audit-Log erstellen
        """
        order = self.get_object()
        
        # Prüfe ob bereits eingegangen
        if order.received_at:
            return Response({
                'error': 'Bestellung wurde bereits eingegangen',
                'received_at': order.received_at
            }, status=400)
        
        try:
            with transaction.atomic():
                # Proportionale Allokation berechnen
                total_items_value = sum(
                    item.qty * item.unit_cost for item in order.items.all()
                )
                
                if total_items_value == 0:
                    return Response({
                        'error': 'Bestellung hat keine Positionen oder alle Kosten sind 0'
                    }, status=400)
                
                # Allokation für jede Position berechnen
                for item in order.items.all():
                    item_value = item.qty * item.unit_cost
                    allocation_ratio = item_value / total_items_value
                    
                    # Versand und Zoll proportional zuweisen
                    item.allocated_shipping = order.shipping_cost * allocation_ratio
                    item.allocated_customs = order.customs_cost * allocation_ratio
                    
                    # Effektive Kosten pro Einheit berechnen
                    total_item_cost = item_value + item.allocated_shipping + item.allocated_customs
                    item.effective_cost_per_unit = total_item_cost / item.qty
                    item.save()
                    
                    # Je nach Typ unterschiedlich verarbeiten
                    if item.target_type == 'MATERIAL':
                        self._process_material_receipt(item)
                    elif item.target_type == 'OILBATCH':
                        self._process_oilbatch_receipt(item)
                
                # Bestellung als eingegangen markieren
                order.received_at = timezone.now()
                order.save()
                
                # Audit-Log erstellen
                AuditLog.objects.create(
                    actor=request.user,
                    action='ORDER_RECEIVE',
                    subject_type='Order',
                    subject_id=order.id,
                    payload_before={'received_at': None},
                    payload_after={'received_at': order.received_at.isoformat()},
                    ip=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
                
                return Response({
                    'message': 'Wareneingang erfolgreich abgeschlossen',
                    'order_id': order.id,
                    'received_at': order.received_at
                })
                
        except Exception as e:
            return Response({
                'error': f'Fehler beim Wareneingang: {str(e)}'
            }, status=500)
    
    def _process_material_receipt(self, item):
        """
        Verarbeitet Material-Wareneingang
        
        Aktualisiert Bestand und Kosten pro Einheit als gleitender Durchschnitt.
        """
        try:
            material = Material.objects.get(id=item.target_id)
            
            # Gleitender Durchschnitt für Kosten berechnen
            old_total_cost = material.stock_qty * material.cost_per_unit
            new_total_cost = item.qty * item.effective_cost_per_unit
            total_qty = material.stock_qty + item.qty
            
            if total_qty > 0:
                material.cost_per_unit = (old_total_cost + new_total_cost) / total_qty
            
            # Bestand aktualisieren
            material.stock_qty += item.qty
            material.save()
            
        except Material.DoesNotExist:
            raise Exception(f"Material mit ID {item.target_id} nicht gefunden")
    
    def _process_oilbatch_receipt(self, item):
        """
        Verarbeitet Öl-Charge-Wareneingang
        
        Erstellt neue OilBatch mit Barcode und Kosten.
        """
        try:
            fragrance = OilBatch.objects.get(id=item.target_id).fragrance
            
            # Neue Öl-Charge erstellen
            oil_batch = OilBatch.objects.create(
                fragrance=fragrance,
                barcode=f"OB{timezone.now().strftime('%Y%m%d%H%M%S')}{item.id}",
                qty_ml=item.qty,
                cost_total=item.qty * item.effective_cost_per_unit,
                cost_per_ml=item.effective_cost_per_unit,
                order_item=item,
                received_at=timezone.now(),
                status='AVAILABLE'
            )
            
        except OilBatch.DoesNotExist:
            raise Exception(f"OilBatch mit ID {item.target_id} nicht gefunden")


class OrderItemViewSet(viewsets.ModelViewSet):
    """ViewSet für Bestellpositionen"""
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer


class OrderReceiveView(viewsets.ModelViewSet):
    """View für Wareneingang"""
    def post(self, request, pk=None):
        return Response({'status': 'Wareneingang wird implementiert'})