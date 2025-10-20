"""
LCREE Audit Serializers
========================

Django REST Framework Serializers für die Audit-App.

Features:
- AuditLogSerializer für Audit-Logs
- Vollständige Validierung und Sicherheit
"""

from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    """
    Serializer für Audit-Logs
    
    Serialisiert Audit-Logs mit allen Details.
    """
    
    actor_name = serializers.CharField(source='actor.get_full_name', read_only=True)
    actor_details = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'actor', 'action', 'subject_type', 'subject_id',
            'payload_before', 'payload_after', 'description', 'ip', 'user_agent',
            'created_at', 'actor_name', 'actor_details'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_actor_details(self, obj):
        """Gibt vollständige Actor-Details zurück"""
        if obj.actor:
            return {
                'id': obj.actor.id,
                'email': obj.actor.email,
                'first_name': obj.actor.first_name,
                'last_name': obj.actor.last_name,
                'role': obj.actor.role,
            }
        return None
