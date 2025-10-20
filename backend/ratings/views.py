"""
LCREE Ratings Views & Serializers
==================================
"""

from rest_framework import viewsets
from rest_framework.response import Response
from .models import Rating
from .serializers import RatingSerializer, PublicRatingSerializer


class RatingViewSet(viewsets.ModelViewSet):
    """ViewSet für Bewertungen"""
    queryset = Rating.objects.all()
    serializer_class = RatingSerializer


class PublicProductView(viewsets.ModelViewSet):
    """Öffentliche Produktseite"""
    def get(self, request, uid=None):
        return Response({'status': 'Öffentliche Produktseite wird implementiert'})


class PublicRatingByQRView(viewsets.ModelViewSet):
    """QR-Code-basierte Bewertung"""
    def post(self, request):
        return Response({'status': 'QR-Code-Bewertung wird implementiert'})