# LCREE - Benutzeranleitung für das Duft- und Produktionssystem

## Inhaltsverzeichnis
1. [Systemübersicht](#systemübersicht)
2. [Erste Schritte](#erste-schritte)
3. [Benutzerverwaltung](#benutzerverwaltung)
4. [Duftverwaltung](#duftverwaltung)
5. [Materialverwaltung](#materialverwaltung)
6. [Container und Rezepte](#container-und-rezepte)
7. [Bestellungen und Wareneingang](#bestellungen-und-wareneingang)
8. [Produktion](#produktion)
9. [Tool-Verbrauch](#tool-verbrauch)
10. [Bewertungen](#bewertungen)
11. [Audit und Nachverfolgung](#audit-und-nachverfolgung)
12. [Systemeinstellungen](#systemeinstellungen)
13. [API-Dokumentation](#api-dokumentation)

---

## Systemübersicht

Das **LCREE-System** ist ein vollständiges Backend für die Verwaltung von Düften, Öl-Chargen, Materialien, Produktion und Verkauf. Es wurde speziell für die Parfumherstellung entwickelt und bietet folgende Hauptfunktionen:

### Kernfunktionen
- **Duftverwaltung**: Verwaltung von Düften mit Noten, Marken und Kategorien
- **Öl-Chargen-Tracking**: Barcode-basierte Verfolgung von Öl-Chargen mit Kostenverfolgung
- **Materialverwaltung**: Verwaltung aller Materialien und Verpackungen
- **Produktion**: Atomare Produktionsprozesse mit automatischem Verkauf
- **Bestellungen**: Vollständiger Wareneingang mit proportionaler Kostenallokation
- **Audit-Trail**: Vollständige Nachverfolgung aller Aktionen

### Technische Besonderheiten
- **Soft-Delete**: Alle wichtigen Daten werden nur "weich" gelöscht
- **Atomare Transaktionen**: Produktion und Wareneingang sind transaktionssicher
- **Passkeys/WebAuthn**: Moderne passwortlose Authentifizierung
- **QR-Codes**: Automatische Generierung für öffentliche Produktseiten
- **Etikettendruck**: Integration mit lokalem Print-Agent

---

## Erste Schritte

### Systemstart
```bash
# Virtuelle Umgebung aktivieren
source venv/bin/activate  # Linux/Mac
# oder
venv\Scripts\activate     # Windows

# Django-Server starten
python manage.py runserver
```

### Admin-Zugang
- URL: `http://localhost:8000/admin/`
- Erstellen Sie zunächst einen Superuser:
```bash
python manage.py createsuperuser
```

### API-Dokumentation
- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`
- Schema: `http://localhost:8000/api/schema/`

---

## Benutzerverwaltung

### Benutzerrollen
Das System unterstützt fünf verschiedene Benutzerrollen:

| Rolle | Beschreibung | Berechtigungen |
|-------|-------------|----------------|
| **ADMIN** | Administrator | Vollzugriff auf alle Funktionen |
| **PRODUCTION** | Produktion | Produktion und Verkauf |
| **WAREHOUSE** | Lager | Wareneingang und Materialverwaltung |
| **SALES** | Verkauf | Verkauf und Kundenbetreuung |
| **VIEWER** | Betrachter | Nur Lesezugriff |

### Benutzer erstellen
1. Gehen Sie zu `/admin/accounts/user/add/`
2. Füllen Sie die Pflichtfelder aus:
   - E-Mail-Adresse (wird als Benutzername verwendet)
   - Vorname und Nachname
   - Rolle auswählen
   - Passwort setzen
3. Speichern Sie den Benutzer

### Passkey-Authentifizierung
Das System unterstützt moderne Passkey-Authentifizierung:
- **Registrierung**: `/api/v1/accounts/auth/passkey/register/`
- **Authentifizierung**: `/api/v1/accounts/auth/passkey/authenticate/`
- **Verwaltung**: `/api/v1/accounts/passkeys/`

---

## Duftverwaltung

### Düfte anlegen
1. Navigieren Sie zu `/admin/fragrances/fragrance/add/`
2. Füllen Sie die Grunddaten aus:
   - **Interner Code**: Eindeutige Kennung (z.B. M-001, W-002, U-003)
   - **Geschlecht**: M (Männlich), W (Weiblich), U (Unisex)
   - **Marke**: Herstellermarke
   - **Name**: Produktname
   - **Offizieller Name**: Vollständiger Name

3. Ergänzen Sie die Duftnoten:
   - **Duftfamilie**: Kategorie des Dufts
   - **Kopfnoten**: JSON-Array mit Top-Notes
   - **Herznoten**: JSON-Array mit Heart-Notes
   - **Basisnoten**: JSON-Array mit Base-Notes

4. Optional:
   - Beschreibung hinzufügen
   - Hauptbild hochladen
   - Parfumo-URL verlinken

### Öl-Chargen verwalten
Öl-Chargen werden automatisch beim Wareneingang erstellt, können aber auch manuell verwaltet werden:

#### Chargen-Status
- **AVAILABLE**: Verfügbar für Produktion
- **LOCKED**: Gesperrt (z.B. während Produktion)
- **EXHAUSTED**: Aufgebraucht

#### Kalibrierung
Chargen können kalibriert werden, um theoretisches vs. gemessenes Volumen zu vergleichen:
```bash
POST /api/v1/fragrances/batches/{id}/calibrate/
{
    "measured_volume_ml": 100.5,
    "reason": "Kalibrierung nach Lagerung"
}
```

#### Toleranz-Management
- Standard-Toleranz: 3%
- Warnung bei Überschreitung
- Empfehlung für Re-Kalibrierung

---

## Materialverwaltung

### Materialien anlegen
1. Gehen Sie zu `/admin/materials/material/add/`
2. Grunddaten eingeben:
   - **Name**: Materialname
   - **Kategorie**: Alkohol, Fixateur, Wasser, Verpackung, etc.
   - **Einheit**: ML (Milliliter) oder PCS (Stück)
   - **SKU/Barcode**: Eindeutige Kennung

3. Bestandsverwaltung:
   - **Bestand**: Aktuelle Menge
   - **Mindestbestand**: Warnung bei Unterschreitung
   - **Kosten pro Einheit**: Gleitender Durchschnitt

4. Verfolgungseinstellungen:
   - **Wird verfolgt**: Bestand wird bei Verbrauch reduziert
   - **Kosten enthalten**: Material wird in Kostenberechnung einbezogen

### Materialkategorien
| Kategorie | Beschreibung | Verwendung |
|-----------|-------------|------------|
| **ALCOHOL** | Alkohol | Basis für Parfums |
| **FIXATEUR** | Fixateur | Verlängerung der Haltbarkeit |
| **WATER** | Wasser | Verdünnung |
| **PACKAGING_BOTTLE** | Verpackung Flakon | Hauptverpackung |
| **PACKAGING_PART** | Verpackung Teil | Einzelteile |
| **PACKAGING_LABEL** | Verpackung Etikett | Etiketten |
| **PACKAGING_BOX** | Verpackung Box | Umverpackung |
| **TOOL** | Werkzeug | Produktionswerkzeuge |
| **OTHER** | Sonstiges | Verschiedenes |

### Verpackungszusammensetzung
Für automatisches Einzelteil-Tracking können Verpackungen in ihre Bestandteile zerlegt werden:
1. Gehen Sie zu `/admin/materials/packagingcompositionpart/add/`
2. Wählen Sie das Hauptmaterial (z.B. Flakon)
3. Fügen Sie die Einzelteile hinzu (z.B. Sprühkopf, Etikett)
4. Geben Sie die Menge pro Hauptmaterial an

---

## Container und Rezepte

### Container definieren
Container sind die verschiedenen Produkttypen, die hergestellt werden können:

1. Navigieren Sie zu `/admin/containers/container/add/`
2. Grunddaten eingeben:
   - **Name**: Container-Name (z.B. "50ml Parfum Flakon")
   - **Typ**: Parfum, Raumspray, Kolonya, etc.
   - **Füllvolumen**: Volumen in ml
   - **Barcode**: Eindeutige Kennung
   - **Verkaufspreis**: Einzelhandelspreis

3. Produktionseinstellungen:
   - **Verlustfaktor Öl (%)**: Standard 2% für Verluste bei der Produktion

### Rezepte erstellen
Rezepte definieren, welche Materialien für einen Container benötigt werden:

1. Gehen Sie zu `/admin/containers/recipe/add/`
2. Container auswählen
3. Komponenten hinzufügen:
   - **Komponentenart**: Öl, Alkohol, Wasser, Verpackung, etc.
   - **Material**: Spezifisches Material (außer bei Öl)
   - **Benötigte Menge**: Pro Container
   - **Einheit**: ML oder PCS
   - **Optional**: Kann die Komponente weggelassen werden?

#### Komponentenarten
- **PLACEHOLDER_OIL**: Platzhalter für das Duftöl
- **ALCOHOL**: Alkohol-Basis
- **WATER**: Wasser für Verdünnung
- **FIXATEUR**: Fixateur
- **PACKAGING_***: Verschiedene Verpackungskomponenten

---

## Bestellungen und Wareneingang

### Bestellung anlegen
1. Gehen Sie zu `/admin/orders/order/add/`
2. Grunddaten eingeben:
   - **Lieferant**: Name des Lieferanten
   - **Währung**: Standard EUR
   - **Zwischensumme**: Summe der Artikel
   - **Versandkosten**: Versandkosten
   - **Zollkosten**: Zollgebühren
   - **Gesamtkosten**: Automatisch berechnet

3. Bestellpositionen hinzufügen:
   - **Zieltyp**: MATERIAL oder OILBATCH
   - **Ziel-ID**: ID des Materials oder der Öl-Charge
   - **Menge**: Bestellte Menge
   - **Einzelkosten**: Kosten pro Einheit

### Wareneingang durchführen
Der Wareneingang ist ein atomarer Prozess, der automatisch:
1. Proportionale Allokation von Versand/Zoll berechnet
2. Materialbestände aktualisiert
3. Neue Öl-Chargen erstellt
4. Kosten als gleitender Durchschnitt berechnet

```bash
POST /api/v1/orders/orders/{id}/receive/
```

#### Automatische Prozesse
- **MATERIAL**: Bestand wird erhöht, Kosten pro Einheit als gleitender Durchschnitt aktualisiert
- **OILBATCH**: Neue Öl-Charge wird mit automatischem Barcode erstellt

---

## Produktion

### Produktionsprozess
Die Produktion ist ein atomarer Prozess, der folgende Schritte umfasst:

1. **Ressourcenprüfung**: Verfügbarkeit von Öl und Materialien
2. **Verbrauch**: Öl und Materialien werden verbraucht
3. **Artikel-Erstellung**: Produzierte Artikel mit QR-Codes
4. **Automatischer Verkauf**: Sofortverkauf (kein Lager)
5. **Etikettendruck**: Automatischer Druck über Print-Agent

### Produktion starten
```bash
POST /api/v1/production/production-commit/
{
    "fragrance_id": 1,
    "container_id": 1,
    "qty": 5,
    "oil_batch_ids": [1, 2]
}
```

### Produktionslogik
1. **Rezept laden**: Aktives Rezept für den Container
2. **Ölbedarf berechnen**: Mit Verlustfaktor
3. **Ressourcen sperren**: `select_for_update()` für atomare Transaktionen
4. **Verbrauch erfassen**: Alle verwendeten Komponenten
5. **Artikel erstellen**: Mit eindeutiger UID und QR-Code
6. **Verkauf erstellen**: Automatischer Sofortverkauf
7. **Etiketten drucken**: HTTP-POST an Print-Agent

### Produktionsstatus
- **DRAFT**: Entwurf
- **READY**: Bereit zur Produktion
- **FAILED**: Fehlgeschlagen
- **DONE**: Abgeschlossen

---

## Tool-Verbrauch

### Tool-Scan
Werkzeuge können außerhalb von Rezepten verbraucht werden:

```bash
POST /api/v1/tools/tool-scan/
{
    "barcode": "TOOL001",
    "qty": 1,
    "reason": "Wartung"
}
```

### Tool-Verbrauch-Logik
1. Material als TOOL prüfen
2. Verfügbaren Bestand prüfen
3. Bestand reduzieren
4. ToolUsage erfassen
5. Audit-Log erstellen

### Tool-Kategorien
Nur Materialien mit Kategorie "TOOL" können über den Tool-Scan verbraucht werden.

---

## Bewertungen

### Öffentliche Produktseiten
Jeder produzierte Artikel erhält eine öffentliche Seite:
- URL: `/public/p/{uid}/`
- Zeigt Duftinformationen und Bewertungen
- Keine Authentifizierung erforderlich

### QR-Code-Bewertungen
Kunden können über QR-Codes bewerten:
```bash
POST /public/ratings/by-qr/
{
    "uid": "ABC123DEF4",
    "stars": 5,
    "comment": "Wunderbarer Duft!",
    "display_name": "Max Mustermann"
}
```

### Bewertungsmoderation
- Bewertungen sind standardmäßig verifiziert
- Moderation möglich über Admin-Interface
- Öffentlichkeitsstatus steuerbar

---

## Audit und Nachverfolgung

### Audit-Log
Alle wichtigen Aktionen werden protokolliert:

| Aktion | Beschreibung |
|--------|-------------|
| **AUTH_LOGIN** | Benutzeranmeldung |
| **AUTH_LOGOUT** | Benutzerabmeldung |
| **ORDER_RECEIVE** | Wareneingang |
| **PRODUCTION_COMMIT** | Produktion bestätigt |
| **SALE_COMMIT** | Verkauf bestätigt |
| **TOOL_CHECKOUT** | Tool-Entnahme |
| **BATCH_ADJUSTMENT** | Charge-Anpassung |
| **CRUD_*** | Erstellen/Aktualisieren/Löschen |

### Audit-Daten
Jeder Log-Eintrag enthält:
- **Akteur**: Benutzer, der die Aktion durchgeführt hat
- **Aktion**: Art der durchgeführten Aktion
- **Objekt**: Betroffenes Objekt (Typ und ID)
- **Vorher/Nachher**: Daten vor und nach der Änderung
- **IP-Adresse**: Client-IP
- **User-Agent**: Browser-Informationen
- **Zeitstempel**: Wann die Aktion stattfand

### Audit-Abfragen
```bash
GET /api/v1/audit/audit-logs/
# Mit Filtern:
?actor=1&action=PRODUCTION_COMMIT&created_at__gte=2024-01-01
```

---

## Systemeinstellungen

### Konfiguration
Systemeinstellungen werden als Singleton verwaltet:

1. Gehen Sie zu `/admin/settingsapp/systemsettings/`
2. Grundlegende Einstellungen:
   - **Firmenname**: Name der Firma
   - **Währung**: Standard-Währung
   - **QR-Code Basis-URL**: URL für öffentliche Produktseiten
   - **Print-Agent URL**: URL des lokalen Print-Agents

3. Produktionseinstellungen:
   - **Standard-Verlustfaktor Öl (%)**: Standard 2%
   - **Zweite Charge-Scan bei unzureichender Menge**: Ja/Nein
   - **Warnung bei älteren Chargen**: Ja/Nein

4. Analytics und Scraper:
   - JSON-Konfiguration für externe Services

### Einstellungen abrufen
```bash
GET /api/v1/settings/system-settings/
```

---

## API-Dokumentation

### Authentifizierung
Das System unterstützt JWT-Token-Authentifizierung:

```bash
# Login
POST /api/v1/accounts/auth/token/
{
    "email": "user@example.com",
    "password": "password"
}

# Token verwenden
Authorization: Bearer <access_token>
```

### API-Endpunkte Übersicht

#### Accounts
- `GET /api/v1/accounts/users/` - Benutzerliste
- `POST /api/v1/accounts/users/` - Benutzer erstellen
- `GET /api/v1/accounts/users/{id}/` - Benutzerdetails
- `POST /api/v1/accounts/users/{id}/soft_delete/` - Soft-Delete
- `POST /api/v1/accounts/users/{id}/restore/` - Wiederherstellen

#### Fragrances
- `GET /api/v1/fragrances/fragrances/` - Düfte auflisten
- `POST /api/v1/fragrances/fragrances/` - Duft erstellen
- `GET /api/v1/fragrances/batches/` - Öl-Chargen auflisten
- `POST /api/v1/fragrances/batches/{id}/calibrate/` - Kalibrierung

#### Materials
- `GET /api/v1/materials/materials/` - Materialien auflisten
- `POST /api/v1/materials/materials/` - Material erstellen
- `GET /api/v1/materials/packaging-compositions/` - Verpackungszusammensetzungen

#### Containers
- `GET /api/v1/containers/containers/` - Container auflisten
- `GET /api/v1/containers/recipes/` - Rezepte auflisten
- `GET /api/v1/containers/recipe-components/` - Rezept-Komponenten

#### Orders
- `GET /api/v1/orders/orders/` - Bestellungen auflisten
- `POST /api/v1/orders/orders/` - Bestellung erstellen
- `POST /api/v1/orders/orders/{id}/receive/` - Wareneingang

#### Production
- `GET /api/v1/production/productions/` - Produktionen auflisten
- `POST /api/v1/production/production-commit/` - Produktion starten
- `GET /api/v1/production/produced-items/` - Produzierte Artikel
- `GET /api/v1/production/sales/` - Verkäufe

#### Tools
- `GET /api/v1/tools/tool-usages/` - Tool-Verbräuche
- `POST /api/v1/tools/tool-scan/` - Tool-Scan

#### Ratings
- `GET /api/v1/ratings/ratings/` - Bewertungen
- `POST /api/v1/ratings/ratings/` - Bewertung erstellen

#### Audit
- `GET /api/v1/audit/audit-logs/` - Audit-Logs

#### Settings
- `GET /api/v1/settings/system-settings/` - Systemeinstellungen
- `PUT /api/v1/settings/system-settings/` - Einstellungen aktualisieren

### Öffentliche APIs (ohne Authentifizierung)
- `GET /public/p/{uid}/` - Öffentliche Produktseite
- `POST /public/ratings/by-qr/` - QR-Code-Bewertung

### Filterung und Suche
Alle Listen-Endpunkte unterstützen:
- **Suche**: `?search=term`
- **Filterung**: `?field=value`
- **Sortierung**: `?ordering=field` oder `?ordering=-field`
- **Paginierung**: `?page=1&page_size=50`

### Beispiel-Abfragen
```bash
# Düfte nach Geschlecht filtern
GET /api/v1/fragrances/fragrances/?gender=M

# Materialien mit niedrigem Bestand
GET /api/v1/materials/materials/?stock_qty__lt=10

# Produktionen des letzten Monats
GET /api/v1/production/productions/?created_at__gte=2024-01-01

# Audit-Logs eines Benutzers
GET /api/v1/audit/audit-logs/?actor=1&action=PRODUCTION_COMMIT
```

---

## Häufige Arbeitsabläufe

### 1. Neuen Duft ins System bringen
1. Duft in `/admin/fragrances/fragrance/add/` anlegen
2. Bestellung mit Öl-Charge erstellen
3. Wareneingang durchführen
4. Öl-Charge kalibrieren (optional)

### 2. Produktion durchführen
1. Verfügbare Öl-Chargen prüfen
2. Materialbestände kontrollieren
3. Produktion über API starten
4. Etiketten automatisch drucken lassen

### 3. Materialbestand auffüllen
1. Bestellung mit Materialien erstellen
2. Wareneingang durchführen
3. Bestände werden automatisch aktualisiert

### 4. Tool-Verbrauch erfassen
1. Tool über Barcode scannen
2. Menge und Grund eingeben
3. Bestand wird automatisch reduziert

---

## Fehlerbehebung

### Häufige Probleme

#### Produktion schlägt fehl
- **Ursache**: Nicht genügend Öl oder Materialien verfügbar
- **Lösung**: Bestände prüfen und ggf. nachbestellen

#### Wareneingang funktioniert nicht
- **Ursache**: Bestellung bereits eingegangen oder fehlerhafte Daten
- **Lösung**: Bestellung prüfen und korrigieren

#### Kalibrierung zeigt Abweichung
- **Ursache**: Toleranz überschritten
- **Lösung**: Charge erneut messen oder Toleranz anpassen

#### Print-Agent nicht erreichbar
- **Ursache**: Print-Agent nicht gestartet oder falsche URL
- **Lösung**: Print-Agent starten und URL in Einstellungen prüfen

### Logs prüfen
- Django-Logs: `logs/lcree.log`
- Admin-Interface: Audit-Logs unter `/admin/audit/auditlog/`

---

## Support und Weiterentwicklung

### Demo-Daten laden
```bash
python manage.py seed_demo
```

### Datenbank zurücksetzen
```bash
python manage.py flush
```

### Migrationen
```bash
python manage.py makemigrations
python manage.py migrate
```

### Tests ausführen
```bash
python manage.py test
```

---

**Hinweis**: Diese Anleitung basiert auf der aktuellen Systemversion. Bei Updates können sich Funktionen und URLs ändern. Die API-Dokumentation unter `/api/docs/` ist immer aktuell.
