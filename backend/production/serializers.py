"""
LCREE Production Serializers
============================

Django REST Framework Serializers für die Production-App.

Features:
- ProductionSerializer für Produktionen
- ProducedItemSerializer für produzierte Artikel
- SaleSerializer für Verkäufe
- ProductionComponentUsageSerializer für Komponentenverbrauch
- Vollständige Validierung und Sicherheit
"""

from rest_framework import serializers
from .models import Production, ProducedItem, Sale, ProductionComponentUsage


class ProductionComponentUsageSerializer(serializers.ModelSerializer):
    """
    Serializer für Komponentenverbrauch
    
    Serialisiert den Verbrauch von Komponenten während der Produktion.
    """
    
    class Meta:
        model = ProductionComponentUsage
        fields = [
            'id', 'component_ref', 'qty_used', 'unit', 'before_stock',
            'after_stock', 'unit_cost_at_use', 'cost_total_at_use'
        ]
        read_only_fields = ['id']


class ProducedItemSerializer(serializers.ModelSerializer):
    """
    Serializer für produzierte Artikel
    
    Serialisiert produzierte Artikel mit QR-Code-Informationen.
    """
    
    fragrance_name = serializers.CharField(source='fragrance.official_name', read_only=True)
    container_name = serializers.CharField(source='container.name', read_only=True)
    
    class Meta:
        model = ProducedItem
        fields = [
            'id', 'production', 'fragrance', 'container', 'status',
            'unit_cost_snapshot', 'price_at_sale', 'serial', 'uid',
            'qr_code', 'produced_at', 'sold_at', 'fragrance_name', 'container_name'
        ]
        read_only_fields = ['id', 'serial', 'uid', 'qr_code', 'produced_at', 'sold_at']


class SaleSerializer(serializers.ModelSerializer):
    """
    Serializer für Verkäufe
    
    Serialisiert Verkaufsdaten.
    """
    
    container_name = serializers.CharField(source='container.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Sale
        fields = [
            'id', 'container', 'qty', 'price_total', 'cost_total',
            'profit_total', 'created_by', 'sold_at', 'container_name', 'created_by_name'
        ]
        read_only_fields = ['id', 'sold_at']


class ProductionSerializer(serializers.ModelSerializer):
    """
    Serializer für Produktionen
    
    Serialisiert Produktionen mit ihren Komponenten und Artikeln.
    """
    
    component_usage = ProductionComponentUsageSerializer(many=True, read_only=True)
    produced_items = ProducedItemSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    fragrance_name = serializers.CharField(source='fragrance.official_name', read_only=True)
    container_name = serializers.CharField(source='container.name', read_only=True)
    
    class Meta:
        model = Production
        fields = [
            'id', 'user', 'fragrance', 'container', 'qty', 'status',
            'oil_cost_used', 'non_oil_cost_used', 'total_production_cost',
            'loss_factor_oil_percent', 'started_at', 'finished_at',
            'failure_reason', 'created_at', 'component_usage', 'produced_items',
            'user_name', 'fragrance_name', 'container_name'
        ]
        read_only_fields = ['id', 'created_at', 'started_at', 'finished_at']
