"""
LCREE Ratings Serializers
=========================

Django REST Framework Serializers für die Ratings-App.

Features:
- RatingSerializer für Bewertungen
- PublicRatingSerializer für öffentliche Bewertungen
- Vollständige Validierung und Sicherheit
"""

from rest_framework import serializers
from .models import Rating


class RatingSerializer(serializers.ModelSerializer):
    """
    Serializer für Bewertungen
    
    Serialisiert Bewertungen mit allen Details.
    """
    
    fragrance_name = serializers.CharField(source='fragrance.official_name', read_only=True)
    container_name = serializers.CharField(source='container.name', read_only=True)
    
    class Meta:
        model = Rating
        fields = [
            'id', 'produced_item', 'fragrance', 'container', 'stars',
            'comment', 'display_name', 'verified', 'is_public',
            'moderated', 'created_at', 'fragrance_name', 'container_name'
        ]
        read_only_fields = ['id', 'created_at', 'verified', 'moderated']


class PublicRatingSerializer(serializers.ModelSerializer):
    """
    Serializer für öffentliche Bewertungen
    
    Serialisiert Bewertungen für öffentliche APIs ohne sensible Daten.
    """
    
    fragrance_name = serializers.CharField(source='fragrance.official_name', read_only=True)
    container_name = serializers.CharField(source='container.name', read_only=True)
    
    class Meta:
        model = Rating
        fields = [
            'stars', 'comment', 'display_name', 'created_at',
            'fragrance_name', 'container_name'
        ]
        read_only_fields = ['created_at']
