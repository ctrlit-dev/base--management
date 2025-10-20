"""
LCREE Materials Views & Serializers
====================================
"""

from rest_framework import viewsets
from .models import Material, PackagingCompositionPart
from .serializers import MaterialSerializer, PackagingCompositionPartSerializer


class MaterialViewSet(viewsets.ModelViewSet):
    """ViewSet für Materialien"""
    queryset = Material.objects.filter(is_deleted=False)
    serializer_class = MaterialSerializer


class PackagingCompositionPartViewSet(viewsets.ModelViewSet):
    """ViewSet für Verpackungszusammensetzung"""
    queryset = PackagingCompositionPart.objects.all()
    serializer_class = PackagingCompositionPartSerializer