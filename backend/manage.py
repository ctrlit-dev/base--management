"""
LCREE - Duft- und Produktionssystem Backend
===========================================

Dieses Django-Projekt implementiert ein vollständiges Backend für das LCREE-System,
das die Verwaltung von Düften, Öl-Chargen, Materialien, Produktion und Verkauf abwickelt.

Wichtige Konzepte:
- Soft-Delete für alle businessrelevanten Modelle
- Atomare Transaktionen für Wareneingang und Produktion
- Passkeys/WebAuthn für sichere Authentifizierung
- Audit-Log für alle Mutationen
- Produktion = Sofortverkauf (kein Lager)
- QR-Codes für öffentliche Produktseiten
- Etikettendruck über lokalen Print-Agent

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
    """Standard Django manage.py für LCREE Backend"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lcree.settings')
    execute_from_command_line(sys.argv)
