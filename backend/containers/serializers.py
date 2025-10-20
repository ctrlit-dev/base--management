"""
LCREE Containers Serializers
=============================

Django REST Framework Serializers für die Containers-App.

Features:
- ContainerSerializer für Container
- RecipeSerializer für Rezepte
- RecipeComponentSerializer für Rezept-Komponenten
- Vollständige Validierung und Sicherheit
"""

from rest_framework import serializers
from .models import Container, Recipe, RecipeComponent


class ContainerSerializer(serializers.ModelSerializer):
    """
    Serializer für Container
    
    Bietet sichere Serialisierung von Container-Daten.
    """
    
    class Meta:
        model = Container
        fields = [
            'id', 'name', 'type', 'fill_volume_ml', 'barcode', 'price_retail',
            'loss_factor_oil_percent', 'active', 'is_deleted', 'deleted_at',
            'deleted_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'deleted_at', 'deleted_by']
    
    def validate_barcode(self, value):
        """Validiert Barcode-Eindeutigkeit"""
        if Container.objects.filter(barcode=value).exclude(id=self.instance.id if self.instance else None).exists():
            raise serializers.ValidationError("Dieser Barcode wird bereits verwendet.")
        return value


class RecipeComponentSerializer(serializers.ModelSerializer):
    """
    Serializer für Rezept-Komponenten
    
    Serialisiert einzelne Komponenten eines Rezepts.
    """
    
    material_name = serializers.CharField(source='material.name', read_only=True)
    
    class Meta:
        model = RecipeComponent
        fields = [
            'id', 'component_kind', 'material', 'qty_required', 'unit',
            'is_optional', 'material_name'
        ]
        read_only_fields = ['id']


class RecipeSerializer(serializers.ModelSerializer):
    """
    Serializer für Rezepte
    
    Serialisiert Rezepte mit ihren Komponenten.
    """
    
    components = RecipeComponentSerializer(many=True, read_only=True)
    container_name = serializers.CharField(source='container.name', read_only=True)
    
    class Meta:
        model = Recipe
        fields = [
            'id', 'container', 'notes', 'active', 'components', 'container_name'
        ]
        read_only_fields = ['id']
