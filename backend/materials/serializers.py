"""
LCREE Materials Serializers
===========================

Django REST Framework Serializers für die Materials-App.

Features:
- MaterialSerializer für Materialien
- PackagingCompositionPartSerializer für Verpackungszusammensetzung
- Vollständige Validierung und Sicherheit
"""

from rest_framework import serializers
from .models import Material, PackagingCompositionPart


class MaterialSerializer(serializers.ModelSerializer):
    """
    Serializer für Materialien
    
    Bietet sichere Serialisierung von Materialdaten mit
    Validierung und Berechtigungen.
    """
    
    class Meta:
        model = Material
        fields = [
            'id', 'name', 'category', 'unit', 'stock_qty', 'min_qty',
            'cost_per_unit', 'sku_or_barcode', 'is_tracked', 'cost_included',
            'is_deleted', 'deleted_at', 'deleted_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'deleted_at', 'deleted_by']
    
    def validate_sku_or_barcode(self, value):
        """Validiert SKU/Barcode-Eindeutigkeit"""
        if value and Material.objects.filter(sku_or_barcode=value).exclude(id=self.instance.id if self.instance else None).exists():
            raise serializers.ValidationError("Diese SKU/Barcode wird bereits verwendet.")
        return value


class PackagingCompositionPartSerializer(serializers.ModelSerializer):
    """
    Serializer für Verpackungszusammensetzung
    
    Serialisiert die Zusammensetzung von Verpackungen.
    """
    
    parent_material_name = serializers.CharField(source='parent_material.name', read_only=True)
    part_material_name = serializers.CharField(source='part_material.name', read_only=True)
    
    class Meta:
        model = PackagingCompositionPart
        fields = [
            'id', 'parent_material', 'part_material', 'qty_per_parent',
            'parent_material_name', 'part_material_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
