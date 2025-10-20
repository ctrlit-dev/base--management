"""
LCREE Ratings URLs
==================

URL-Konfiguration für die Ratings-App.

Endpunkte:
- /api/v1/ratings/ratings/ - Bewertungsverwaltung
- /public/p/{uid}/ - Öffentliche Produktseite
- /public/ratings/by-qr/ - QR-Code-basierte Bewertung
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router für ViewSets
router = DefaultRouter()
router.register(r'ratings', views.RatingViewSet)

urlpatterns = [
    # ViewSet-basierte URLs
    path('', include(router.urls)),
]

# Öffentliche URLs (ohne Authentifizierung)
public_urlpatterns = [
    path('p/<str:uid>/', views.PublicProductView.as_view({'get': 'get'}), name='public-product'),
    path('ratings/by-qr/', views.PublicRatingByQRView.as_view({'post': 'post'}), name='public-rating-by-qr'),
]
