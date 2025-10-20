"""
LCREE Containers URLs
=====================

URL-Konfiguration für die Containers-App.

Endpunkte:
- /api/v1/containers/containers/ - Container-Verwaltung
- /api/v1/containers/recipes/ - Rezept-Verwaltung
- /api/v1/containers/components/ - Rezept-Komponenten
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router für ViewSets
router = DefaultRouter()
router.register(r'containers', views.ContainerViewSet)
router.register(r'recipes', views.RecipeViewSet)
router.register(r'components', views.RecipeComponentViewSet)

urlpatterns = [
    # ViewSet-basierte URLs
    path('', include(router.urls)),
]
