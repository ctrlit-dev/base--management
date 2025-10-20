"""
LCREE Ratings Public URLs
=========================

Öffentliche URLs für die Ratings-App (ohne Authentifizierung).

Endpunkte:
- /public/p/{uid}/ - Öffentliche Produktseite
- /public/ratings/by-qr/ - QR-Code-basierte Bewertung
"""

from django.urls import path
from . import views

urlpatterns = [
    path('p/<str:uid>/', views.PublicProductView.as_view({'get': 'get'}), name='public-product'),
    path('ratings/by-qr/', views.PublicRatingByQRView.as_view({'post': 'post'}), name='public-rating-by-qr'),
]
