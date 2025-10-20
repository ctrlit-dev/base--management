"""
LCREE Orders URLs
=================

URL-Konfiguration für die Orders-App.

Endpunkte:
- /api/v1/orders/orders/ - Bestellungsverwaltung
- /api/v1/orders/items/ - Bestellpositionen
- /api/v1/orders/{id}/receive/ - Wareneingang
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router für ViewSets
router = DefaultRouter()
router.register(r'orders', views.OrderViewSet)
router.register(r'items', views.OrderItemViewSet)

urlpatterns = [
    # ViewSet-basierte URLs
    path('', include(router.urls)),
    
    # Spezielle Aktionen (werden automatisch durch @action decorator generiert)
    # path('orders/<int:pk>/receive/', wird automatisch durch OrderViewSet.receive generiert
]
