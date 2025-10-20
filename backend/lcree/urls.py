"""
LCREE Backend URL Configuration
==============================

Haupt-URL-Konfiguration für das LCREE Django-Backend.
Definiert alle API-Endpunkte und statischen Pfade.

API-Struktur:
- /api/v1/accounts/ - Benutzer und Authentifizierung
- /api/v1/fragrances/ - Düfte und Öl-Chargen
- /api/v1/materials/ - Materialien und Verpackungen
- /api/v1/containers/ - Container und Rezepte
- /api/v1/orders/ - Bestellungen und Wareneingang
- /api/v1/production/ - Produktion und Verkauf
- /api/v1/ratings/ - Bewertungen
- /api/v1/tools/ - Tool-Verbrauch
- /api/v1/audit/ - Audit-Logs
- /api/v1/settings/ - Systemeinstellungen
- /public/ - Öffentliche APIs (QR-Codes, Bewertungen)
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # API v1 Endpoints
    path('api/v1/accounts/', include('accounts.urls')),
    path('api/v1/fragrances/', include('fragrances.urls')),
    path('api/v1/materials/', include('materials.urls')),
    path('api/v1/containers/', include('containers.urls')),
    path('api/v1/orders/', include('orders.urls')),
    path('api/v1/production/', include('production.urls')),
    path('api/v1/ratings/', include('ratings.urls')),
    path('api/v1/tools/', include('tools.urls')),
    path('api/v1/audit/', include('audit.urls')),
    path('api/v1/settings/', include('settingsapp.urls')),
    path('api/v1/dashboard/', include('dashboard.urls')),
    
    # Public APIs (ohne Authentifizierung)
    path('public/', include('ratings.public_urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    # Debug Toolbar
    if 'debug_toolbar' in settings.INSTALLED_APPS:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns
