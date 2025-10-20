"""
LCREE Settings Views & Serializers
===================================
"""

from rest_framework import viewsets
from .models import SystemSettings
from .serializers import SystemSettingsSerializer


class SystemSettingsViewSet(viewsets.ModelViewSet):
    """ViewSet für Systemeinstellungen"""
    queryset = SystemSettings.objects.all()
    serializer_class = SystemSettingsSerializer