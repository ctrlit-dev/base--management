# User Management System - Benutzer-Bereinigung und Neuerstellung

## Problem
Die Datenbank enthält noch Benutzer mit den alten Rollen-Namen (`PRODUCTION`, `WAREHOUSE`, `SALES`, `VIEWER`), die nicht mehr unterstützt werden.

## Lösung
Alle bestehenden Benutzer werden gelöscht und neue Benutzer mit den korrekten Rollen erstellt.

## Verwendung

### 1. Dry Run (Empfohlen zuerst)
```bash
cd backend
python manage.py cleanup_and_create_users --dry-run
```

Dies zeigt an, was gelöscht/erstellt würde, ohne Änderungen vorzunehmen.

### 2. Echte Ausführung
```bash
cd backend
python manage.py cleanup_and_create_users
```

**WARNUNG:** Dies löscht ALLE bestehenden Benutzer!

## Erstellte Benutzer

| E-Mail | Rolle | Passwort | Beschreibung |
|--------|-------|-----------|--------------|
| superadmin@usermanagement.local | SUPER_ADMIN | superadmin123 | Super-Administrator (höchste Berechtigung) |
| admin@usermanagement.local | ADMIN | admin123 | Administrator (Systemverwaltung) |
| manager@usermanagement.local | MANAGER | manager123 | Manager (Team-/Projektverwaltung) |
| user@usermanagement.local | USER | user123 | Standard-Benutzer (grundlegende Funktionen) |
| guest@usermanagement.local | GUEST | guest123 | Gast (nur Lesezugriff) |

## Rollen-Übersicht

### Neue Rollen (Backend-kompatibel)
- **SUPER_ADMIN**: Vollzugriff auf alle Systemfunktionen
- **ADMIN**: Benutzer- und Systemverwaltung  
- **MANAGER**: Team- und Projektverwaltung
- **USER**: Standard-Benutzer mit grundlegenden Funktionen
- **GUEST**: Gast mit nur Lesezugriff

### Entfernte Rollen (nicht mehr unterstützt)
- ~~PRODUCTION~~ → MANAGER
- ~~WAREHOUSE~~ → USER  
- ~~SALES~~ → USER
- ~~VIEWER~~ → GUEST

## Nach der Ausführung
1. Alle Benutzer haben die neuen Rollen-Namen
2. Der Benutzer-Manager funktioniert ohne Fehler
3. Neue Benutzer können mit den korrekten Rollen erstellt werden
4. Die Login-Seite zeigt die Anmeldedaten für alle Rollen

## Sicherheit
- Alle Passwörter sind einfach gehalten für Testzwecke
- In der Produktion sollten sichere Passwörter verwendet werden
- Benutzer können ihre Passwörter nach dem ersten Login ändern
