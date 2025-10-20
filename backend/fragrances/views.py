"""
LCREE Fragrances Views
======================

Django REST Framework Views für die Fragrances-App.
"""

from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from .models import Fragrance, OilBatch
from .serializers import FragranceSerializer, OilBatchSerializer


class FragranceViewSet(viewsets.ModelViewSet):
    """ViewSet für Duftverwaltung"""
    queryset = Fragrance.objects.filter(is_deleted=False)
    serializer_class = FragranceSerializer


class OilBatchViewSet(viewsets.ModelViewSet):
    """ViewSet für Öl-Chargen-Verwaltung"""
    queryset = OilBatch.objects.filter(is_deleted=False)
    serializer_class = OilBatchSerializer


class OilBatchCalibrateView(APIView):
    """View für Öl-Chargen-Kalibrierung"""
    
    def post(self, request, pk=None):
        """
        Kalibrierung einer Öl-Charge
        
        Vergleicht theoretisches vs. gemessenes Volumen und passt an.
        """
        try:
            oil_batch = OilBatch.objects.get(id=pk)
            
            measured_volume = request.data.get('measured_volume_ml')
            reason = request.data.get('reason', 'Kalibrierung')
            
            if not measured_volume:
                return Response({
                    'error': 'measured_volume_ml ist erforderlich'
                }, status=400)
            
            # Differenz berechnen
            theoretical_volume = oil_batch.theoretical_volume_ml
            difference = measured_volume - theoretical_volume
            difference_percent = (difference / theoretical_volume) * 100 if theoretical_volume > 0 else 0
            
            # Öl-Charge aktualisieren
            oil_batch.measured_volume_ml = measured_volume
            oil_batch.last_verified_at = timezone.now()
            oil_batch.save()
            
            # Audit-Log erstellen
            from audit.models import AuditLog
            AuditLog.objects.create(
                actor=request.user,
                action='BATCH_ADJUSTMENT',
                subject_type='OilBatch',
                subject_id=oil_batch.id,
                payload_before={'theoretical_volume_ml': theoretical_volume},
                payload_after={'measured_volume_ml': measured_volume, 'difference_percent': difference_percent},
                ip=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'message': 'Kalibrierung erfolgreich',
                'oil_batch_id': oil_batch.id,
                'theoretical_volume_ml': theoretical_volume,
                'measured_volume_ml': measured_volume,
                'difference_ml': difference,
                'difference_percent': difference_percent
            })
            
        except OilBatch.DoesNotExist:
            return Response({
                'error': f'Öl-Charge mit ID {pk} nicht gefunden'
            }, status=404)
        except Exception as e:
            return Response({
                'error': f'Fehler bei der Kalibrierung: {str(e)}'
            }, status=500)