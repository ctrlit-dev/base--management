"""
LCREE Fragrances Serializers
============================

Django REST Framework Serializers für die Fragrances-App.
"""

from rest_framework import serializers
from .models import Fragrance, OilBatch


class FragranceSerializer(serializers.ModelSerializer):
    """Serializer für Düfte"""
    
    class Meta:
        model = Fragrance
        fields = '__all__'


class OilBatchSerializer(serializers.ModelSerializer):
    """Serializer für Öl-Chargen"""
    
    class Meta:
        model = OilBatch
        fields = '__all__'
