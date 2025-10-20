"""
LCREE Production URLs
======================

URL-Konfiguration für die Production-App.

Endpunkte:
- /api/v1/production/productions/ - Produktionsverwaltung
- /api/v1/production/items/ - Produzierte Artikel
- /api/v1/production/sales/ - Verkäufe
- /api/v1/production/commit/ - Produktion bestätigen
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router für ViewSets
router = DefaultRouter()
router.register(r'productions', views.ProductionViewSet)
router.register(r'items', views.ProducedItemViewSet)
router.register(r'sales', views.SaleViewSet)

urlpatterns = [
    # ViewSet-basierte URLs
    path('', include(router.urls)),
    
    # Spezielle Aktionen
    path('commit/', views.ProductionCommitView.as_view({'post': 'post'}), name='production-commit'),
]
