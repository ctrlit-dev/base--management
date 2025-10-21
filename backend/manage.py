"""
User Management Backend
======================

Dieses Django-Projekt implementiert ein vollständiges Backend für das User Management System,
das die Verwaltung von Benutzern, Rollen, Authentifizierung und Systemeinstellungen abwickelt.

Wichtige Konzepte:
- Soft-Delete für alle businessrelevanten Modelle
- Passkeys/WebAuthn für sichere Authentifizierung
- Audit-Log für alle Mutationen
- Umfassende Admin-Einstellungen
- Moderne Authentifizierung mit JWT-Fallback

Autor: Senior Backend Developer
Datum: 2024
Python: 3.14
Django: 5.x
"""

import os
import sys
from pathlib import Path
from django.core.management import execute_from_command_line

if __name__ == '__main__':
    """Standard Django manage.py für User Management Backend"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lcree.settings')
    execute_from_command_line(sys.argv)
