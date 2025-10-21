"""
User Management Backend URL Configuration
=========================================

Haupt-URL-Konfiguration für das User Management Django-Backend.
Definiert alle API-Endpunkte und statischen Pfade.

API-Struktur:
- /api/v1/accounts/ - Benutzer und Authentifizierung
- /api/v1/audit/ - Audit-Logs
- /api/v1/settings/ - Systemeinstellungen
- /api/v1/dashboard/ - Dashboard-Daten
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
    path('api/v1/audit/', include('audit.urls')),
    path('api/v1/settings/', include('settingsapp.urls')),
    path('api/v1/dashboard/', include('dashboard.urls')),
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
