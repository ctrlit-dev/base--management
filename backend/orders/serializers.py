"""
LCREE Orders Serializers
========================

Django REST Framework Serializers für die Orders-App.

Features:
- OrderSerializer für Bestellungen
- OrderItemSerializer für Bestellpositionen
- Vollständige Validierung und Sicherheit
"""

from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    """
    Serializer für Bestellpositionen
    
    Serialisiert einzelne Positionen einer Bestellung.
    """
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'target_type', 'target_id', 'qty', 'unit_cost',
            'allocated_shipping', 'allocated_customs', 'effective_cost_per_unit'
        ]
        read_only_fields = ['id']


class OrderSerializer(serializers.ModelSerializer):
    """
    Serializer für Bestellungen
    
    Serialisiert Bestellungen mit ihren Positionen.
    """
    
    items = OrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'supplier', 'currency', 'items_subtotal', 'shipping_cost',
            'customs_cost', 'total_cost', 'note', 'ordered_at', 'received_at',
            'created_at', 'items'
        ]
        read_only_fields = ['id', 'created_at']
