"""
LCREE Fragrances URLs
=====================

URL-Konfiguration für die Fragrances-App.

Endpunkte:
- /api/v1/fragrances/fragrances/ - Duftverwaltung
- /api/v1/fragrances/batches/ - Öl-Chargen-Verwaltung
- /api/v1/fragrances/batches/{id}/calibrate/ - Kalibrierung
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router für ViewSets
router = DefaultRouter()
router.register(r'fragrances', views.FragranceViewSet)
router.register(r'batches', views.OilBatchViewSet)

urlpatterns = [
    # ViewSet-basierte URLs
    path('', include(router.urls)),
    
    # Spezielle Aktionen
    path('batches/<int:pk>/calibrate/', views.OilBatchCalibrateView.as_view(), name='batch-calibrate'),
]
