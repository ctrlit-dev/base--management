"""
LCREE Backend ASGI Configuration
================================

ASGI-Konfiguration für das LCREE Django-Backend.
Wird für WebSocket-Unterstützung und moderne Deployment-Szenarien verwendet.
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lcree.settings')

application = get_asgi_application()
