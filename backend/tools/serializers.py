"""
LCREE Tools Serializers
========================

Django REST Framework Serializers für die Tools-App.

Features:
- ToolUsageSerializer für Tool-Verbräuche
- Vollständige Validierung und Sicherheit
"""

from rest_framework import serializers
from .models import ToolUsage


class ToolUsageSerializer(serializers.ModelSerializer):
    """
    Serializer für Tool-Verbräuche
    
    Serialisiert Tool-Verbräuche außerhalb von Rezepten.
    """
    
    material_name = serializers.CharField(source='material.name', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = ToolUsage
        fields = [
            'id', 'material', 'user', 'qty_used', 'reason', 'used_at',
            'material_name', 'user_name'
        ]
        read_only_fields = ['id', 'used_at']
