"""
LCREE Backend WSGI Configuration
================================

WSGI-Konfiguration für das LCREE Django-Backend.
Wird für Produktions-Deployment verwendet.
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lcree.settings')

application = get_wsgi_application()
