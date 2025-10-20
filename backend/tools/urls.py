"""
LCREE Tools URLs
================

URL-Konfiguration für die Tools-App.

Endpunkte:
- /api/v1/tools/usages/ - Tool-Verbrauch
- /api/v1/tools/scan/ - Tool-Scan
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router für ViewSets
router = DefaultRouter()
router.register(r'usages', views.ToolUsageViewSet)

urlpatterns = [
    # ViewSet-basierte URLs
    path('', include(router.urls)),
    
    # Spezielle Aktionen
    path('scan/', views.ToolScanView.as_view({'post': 'post'}), name='tool-scan'),
]
