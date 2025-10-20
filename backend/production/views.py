"""
LCREE Production Views & Serializers
====================================
"""

from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from django.utils import timezone
from django.db.models import F
from .models import Production, ProducedItem, Sale, ProductionComponentUsage
from .serializers import ProductionSerializer, ProducedItemSerializer, SaleSerializer, ProductionComponentUsageSerializer
from fragrances.models import OilBatch
from materials.models import Material, PackagingCompositionPart
from containers.models import Recipe, RecipeComponent
from audit.models import AuditLog
from django.conf import settings
import requests
import secrets
import string


class ProductionViewSet(viewsets.ModelViewSet):
    """ViewSet für Produktionen"""
    queryset = Production.objects.all()
    serializer_class = ProductionSerializer


class ProducedItemViewSet(viewsets.ModelViewSet):
    """ViewSet für produzierte Artikel"""
    queryset = ProducedItem.objects.all()
    serializer_class = ProducedItemSerializer


class SaleViewSet(viewsets.ModelViewSet):
    """ViewSet für Verkäufe"""
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer


class ProductionCommitView(viewsets.ModelViewSet):
    """View für Produktionsbestätigung"""
    
    def post(self, request):
        """
        Produktionsbestätigung mit atomarer Transaktion
        
        Implementiert die komplette Produktionslogik:
        1. Ressourcenprüfung mit select_for_update()
        2. Öl- und Materialverbrauch
        3. ProducedItem mit QR-Code erstellen
        4. Automatischer Verkauf
        5. Label-Druck an Print-Agent
        6. Audit-Logs
        """
        data = request.data
        
        # Validierung der Eingabedaten
        required_fields = ['fragrance_id', 'container_id', 'qty', 'oil_batch_ids']
        for field in required_fields:
            if field not in data:
                return Response({
                    'error': f'Feld {field} ist erforderlich'
                }, status=400)
        
        try:
            with transaction.atomic():
                # Rezept laden
                recipe = Recipe.objects.get(
                    container_id=data['container_id'],
                    active=True
                )
                
                # Ölbedarf berechnen (mit Verlustfaktor)
                container = recipe.container
                oil_required_per_unit = container.fill_volume_ml * (1 + container.loss_factor_oil_percent / 100)
                total_oil_required = oil_required_per_unit * data['qty']
                
                # Öl-Chargen laden und sperren
                oil_batches = OilBatch.objects.select_for_update().filter(
                    id__in=data['oil_batch_ids'],
                    status='AVAILABLE'
                )
                
                # Verfügbare Ölmenge prüfen
                available_oil = sum(batch.qty_ml for batch in oil_batches)
                if available_oil < total_oil_required:
                    return Response({
                        'error': f'Nicht genügend Öl verfügbar. Benötigt: {total_oil_required}ml, Verfügbar: {available_oil}ml'
                    }, status=400)
                
                # Produktion erstellen
                production = Production.objects.create(
                    user=request.user,
                    fragrance_id=data['fragrance_id'],
                    container_id=data['container_id'],
                    qty=data['qty'],
                    status='READY',
                    loss_factor_oil_percent=container.loss_factor_oil_percent,
                    started_at=timezone.now()
                )
                
                # Öl-Verbrauch verarbeiten
                oil_cost_total = 0
                remaining_oil_needed = total_oil_required
                
                for batch in oil_batches:
                    if remaining_oil_needed <= 0:
                        break
                    
                    oil_to_use = min(batch.qty_ml, remaining_oil_needed)
                    
                    # Öl-Charge aktualisieren
                    batch.qty_ml = F('qty_ml') - oil_to_use
                    batch.save()
                    
                    # Komponentenverbrauch erfassen
                    ProductionComponentUsage.objects.create(
                        production=production,
                        component_ref=batch,
                        qty_used=oil_to_use,
                        unit='ML',
                        before_stock=batch.qty_ml + oil_to_use,
                        after_stock=batch.qty_ml,
                        unit_cost_at_use=batch.cost_per_ml,
                        cost_total_at_use=oil_to_use * batch.cost_per_ml
                    )
                    
                    oil_cost_total += oil_to_use * batch.cost_per_ml
                    remaining_oil_needed -= oil_to_use
                
                # Material-Verbrauch verarbeiten
                material_cost_total = 0
                
                for component in recipe.components.all():
                    if component.component_kind == 'PLACEHOLDER_OIL':
                        continue  # Öl bereits verarbeitet
                    
                    material = component.material
                    qty_needed = component.qty_required * data['qty']
                    
                    # Material sperren und prüfen
                    material = Material.objects.select_for_update().get(id=material.id)
                    
                    if material.stock_qty < qty_needed:
                        return Response({
                            'error': f'Nicht genügend {material.name} verfügbar. Benötigt: {qty_needed}, Verfügbar: {material.stock_qty}'
                        }, status=400)
                    
                    # Bestand reduzieren
                    material.stock_qty = F('stock_qty') - qty_needed
                    material.save()
                    
                    # Komponentenverbrauch erfassen
                    ProductionComponentUsage.objects.create(
                        production=production,
                        component_ref=material,
                        qty_used=qty_needed,
                        unit=component.unit,
                        before_stock=material.stock_qty + qty_needed,
                        after_stock=material.stock_qty,
                        unit_cost_at_use=material.cost_per_unit,
                        cost_total_at_use=qty_needed * material.cost_per_unit
                    )
                    
                    material_cost_total += qty_needed * material.cost_per_unit
                
                # Produktionskosten aktualisieren
                production.oil_cost_used = oil_cost_total
                production.non_oil_cost_used = material_cost_total
                production.total_production_cost = oil_cost_total + material_cost_total
                production.status = 'DONE'
                production.finished_at = timezone.now()
                production.save()
                
                # Produzierte Artikel erstellen
                produced_items = []
                total_cost_per_item = production.total_production_cost / data['qty']
                
                for i in range(data['qty']):
                    # Eindeutige UID generieren
                    uid = ''.join(secrets.choices(string.ascii_uppercase + string.digits, k=10))
                    
                    # QR-Code URL generieren
                    qr_code_url = f"{settings.QR_BASE_URL}/p/{uid}"
                    
                    produced_item = ProducedItem.objects.create(
                        production=production,
                        fragrance_id=data['fragrance_id'],
                        container_id=data['container_id'],
                        status='SOLD',
                        unit_cost_snapshot=total_cost_per_item,
                        price_at_sale=container.price_retail,
                        uid=uid,
                        qr_code=qr_code_url,
                        produced_at=timezone.now(),
                        sold_at=timezone.now()
                    )
                    
                    produced_items.append(produced_item)
                
                # Automatischen Verkauf erstellen
                sale = Sale.objects.create(
                    container=container,
                    qty=data['qty'],
                    price_total=data['qty'] * container.price_retail,
                    cost_total=production.total_production_cost,
                    profit_total=(data['qty'] * container.price_retail) - production.total_production_cost,
                    created_by=request.user,
                    sold_at=timezone.now()
                )
                
                # Label-Druck an Print-Agent
                self._print_labels(produced_items)
                
                # Audit-Logs erstellen
                AuditLog.objects.create(
                    actor=request.user,
                    action='PRODUCTION_COMMIT',
                    subject_type='Production',
                    subject_id=production.id,
                    payload_before={'status': 'READY'},
                    payload_after={'status': 'DONE', 'finished_at': production.finished_at.isoformat()},
                    ip=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
                
                AuditLog.objects.create(
                    actor=request.user,
                    action='SALE_COMMIT',
                    subject_type='Sale',
                    subject_id=sale.id,
                    payload_before={},
                    payload_after={'qty': sale.qty, 'price_total': float(sale.price_total)},
                    ip=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
                
                return Response({
                    'message': 'Produktion erfolgreich abgeschlossen',
                    'production_id': production.id,
                    'sale_id': sale.id,
                    'produced_items': len(produced_items),
                    'total_cost': float(production.total_production_cost),
                    'total_revenue': float(sale.price_total),
                    'profit': float(sale.profit_total)
                })
                
        except Exception as e:
            return Response({
                'error': f'Fehler bei der Produktion: {str(e)}'
            }, status=500)
    
    def _print_labels(self, produced_items):
        """
        Sendet Label-Druckaufträge an den Print-Agent
        
        HTTP POST an den lokalen Print-Agent für jeden produzierten Artikel.
        """
        try:
            print_agent_url = settings.PRINT_AGENT_URL
            
            for item in produced_items:
                label_data = {
                    'uid': item.uid,
                    'fragrance_name': item.fragrance.official_name,
                    'container_name': item.container.name,
                    'batch_code': item.production.id,
                    'produced_at': item.produced_at.isoformat(),
                    'qr_url': item.qr_code
                }
                
                response = requests.post(
                    f"{print_agent_url}/print-label",
                    json=label_data,
                    timeout=5
                )
                
                if response.status_code != 200:
                    # Log Fehler, aber Produktion nicht stoppen
                    print(f"Label-Druck fehlgeschlagen für {item.uid}: {response.text}")
                    
        except Exception as e:
            # Log Fehler, aber Produktion nicht stoppen
            print(f"Print-Agent Fehler: {str(e)}")