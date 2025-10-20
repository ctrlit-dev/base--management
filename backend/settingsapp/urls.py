"""
LCREE Settings URLs
==================

URL-Konfiguration für die Settings-App.

Endpunkte:
- /api/v1/settings/settings/ - Systemeinstellungen
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router für ViewSets
router = DefaultRouter()
router.register(r'settings', views.SystemSettingsViewSet)

urlpatterns = [
    # ViewSet-basierte URLs
    path('', include(router.urls)),
]
