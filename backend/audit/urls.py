"""
LCREE Audit URLs
================

URL-Konfiguration für die Audit-App.

Endpunkte:
- /api/v1/audit/logs/ - Audit-Logs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router für ViewSets
router = DefaultRouter()
router.register(r'logs', views.AuditLogViewSet)

urlpatterns = [
    # ViewSet-basierte URLs
    path('', include(router.urls)),
]
