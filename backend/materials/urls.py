"""
LCREE Materials URLs
====================

URL-Konfiguration für die Materials-App.

Endpunkte:
- /api/v1/materials/materials/ - Materialverwaltung
- /api/v1/materials/compositions/ - Verpackungszusammensetzung
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router für ViewSets
router = DefaultRouter()
router.register(r'materials', views.MaterialViewSet)
router.register(r'compositions', views.PackagingCompositionPartViewSet)

urlpatterns = [
    # ViewSet-basierte URLs
    path('', include(router.urls)),
]
