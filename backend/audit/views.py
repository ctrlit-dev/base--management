"""
LCREE Audit Views & Serializers
================================
"""

from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ModelViewSet):
    """ViewSet für Audit-Logs mit Filter-Unterstützung"""
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    
    # Filter-Unterstützung
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['action', 'actor', 'subject_type', 'created_at']
    search_fields = ['description', 'action', 'subject_type']
    ordering_fields = ['created_at', 'action', 'actor']
    ordering = ['-created_at']  # Standard-Sortierung: Neueste zuerst