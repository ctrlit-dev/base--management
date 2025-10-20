# Developer Tools - Anleitung

## Übersicht

Dieses Projekt enthält jetzt umfassende Developer-Tools, die die Entwicklung und das Testing erleichtern:

1. **Developer Menu** - Zentrale Tool-Sammlung
2. **Komponenten Showcase** - Übersicht aller UI-Komponenten
3. **Template Page** - Wiederverwendbare Seitenvorlage

## Developer Menu

Das Developer Menu ist ein schwebender Button (unten rechts) mit folgenden Funktionen:

### Toast Tests
- **Success Toast** - Grüne Erfolgs-Nachricht
- **Error Toast** - Rote Fehler-Nachricht  
- **Info Toast** - Blaue Informations-Nachricht
- **Loading Toast** - Gelber Lade-Indikator
- **Custom Toast** - Benutzerdefinierte Nachricht
- **Persistent Toast** - Bleibende Nachricht
- **Alle Toasts löschen** - Löscht alle aktiven Toasts

### Komponenten Navigation
- **Komponenten Showcase** - Navigiert zur Komponenten-Übersicht
- **Template Seite** - Navigiert zur Template-Vorlage
- **Beispiel Seite** - Navigiert zur Beispiel-Seite

### Einstellungen
- **Theme Toggle** - Wechselt zwischen Dark/Light Mode
- **Navigation Toggle** - Aktiviert/deaktiviert Sticky Navigation
- **Hintergrund Optionen** - Wählt verschiedene Hintergrund-Styles

### Utilities
- **Text kopieren** - Kopiert Test-Text in Zwischenablage
- **Local Storage leeren** - Löscht alle lokalen Daten
- **Session Storage leeren** - Löscht alle Session-Daten
- **Seite neu laden** - Lädt die aktuelle Seite neu

## Komponenten Showcase

Die Komponenten-Seite (`/components`) zeigt alle verfügbaren UI-Elemente:

### Buttons
- **Varianten**: Primary, Secondary, Danger, Success, Warning, Ghost, Outline
- **Größen**: Small, Medium, Large
- **Zustände**: Default, Loading, Success, Error
- **Button Groups**: Gruppierte Buttons

### Formulare
- **Text Input** - Standard Text-Eingabe
- **Password Input** - Passwort-Eingabe mit Toggle
- **Select** - Dropdown-Auswahl
- **Checkbox** - Checkbox mit verschiedenen Zuständen
- **Textarea** - Mehrzeilige Text-Eingabe

### Cards
- **Base Card** - Einfache Card
- **Card with Header** - Card mit Titel und Untertitel
- **Stats Card** - Statistik-Card mit Trend-Anzeige
- **Feature Card** - Feature-Card mit Icon und Aktion
- **List Card** - Card mit Listen-Elementen
- **Collapsible Card** - Aufklappbare Card

### Navigation
- Alle verfügbaren Navigation-Icons
- Code-Beispiele für jeden Icon

### Icons
- Übersicht aller verwendeten Heroicons
- Code-Snippets für jeden Icon

## Template Page

Die Template-Seite (`/template`) ist eine wiederverwendbare Vorlage für neue Seiten:

### Features
- ✅ Top Navigation mit allen Menüpunkten
- ✅ Settings Sidebar für Theme-Einstellungen
- ✅ Developer Menu für Testing
- ✅ Dark/Light Mode Support
- ✅ Responsive Design
- ✅ Animations mit Framer Motion

### Verwendung

```tsx
import { TemplatePage } from './pages/TemplatePage';

// Einfache Verwendung
<TemplatePage 
  title="Meine Seite" 
  subtitle="Beschreibung der Seite"
>
  <div>Hier kommt der Inhalt hin</div>
</TemplatePage>

// Ohne Developer Menu (für Produktion)
<TemplatePage 
  title="Produktions Seite" 
  subtitle="Ohne Developer Tools"
  showDevMenu={false}
>
  <div>Produktions-Inhalt</div>
</TemplatePage>
```

### Verfügbare Routen

- `/components` - Komponenten Showcase
- `/template` - Leere Template-Seite
- `/example` - Beispiel-Seite mit Template
- `/production` - Produktions-Seite ohne Developer Menu

## Dark/Light Mode

Alle neuen Komponenten unterstützen automatisch Dark/Light Mode:

- **Automatische Anpassung** - Komponenten reagieren auf Theme-Änderungen
- **Konsistente Farben** - Verwendung der definierten CSS-Variablen
- **Smooth Transitions** - Sanfte Übergänge zwischen Modi

## Entwickler-Tipps

### Developer Menu verwenden
1. Klicke auf den schwebenden Button unten rechts
2. Wähle den gewünschten Tab
3. Teste verschiedene Funktionen
4. Nutze die Navigation zu anderen Seiten

### Neue Seiten erstellen
1. Verwende `TemplatePage` als Basis
2. Passe Titel und Untertitel an
3. Füge deinen Inhalt hinzu
4. Teste mit Developer Menu

### Komponenten verwenden
1. Gehe zur Komponenten-Seite (`/components`)
2. Schaue dir die Beispiele an
3. Kopiere den Code mit dem Clipboard-Button
4. Implementiere in deiner Seite

### Theme testen
1. Öffne das Developer Menu
2. Gehe zum "Einstellungen" Tab
3. Teste verschiedene Themes
4. Probiere verschiedene Hintergründe

## Technische Details

### Abhängigkeiten
- **Framer Motion** - Für Animationen
- **React Hot Toast** - Für Toast-Nachrichten
- **Heroicons** - Für Icons
- **Tailwind CSS** - Für Styling

### Store Integration
- **Theme Store** - Theme-Management
- **Background Store** - Hintergrund-Management  
- **Navigation Store** - Navigation-Einstellungen

### Responsive Design
- **Mobile First** - Optimiert für mobile Geräte
- **Breakpoints** - sm, md, lg, xl
- **Flexible Layouts** - Grid und Flexbox

## Troubleshooting

### Developer Menu öffnet nicht
- Überprüfe, ob der Button sichtbar ist (unten rechts)
- Stelle sicher, dass `showDevMenu={true}` gesetzt ist

### Toast-Nachrichten funktionieren nicht
- Überprüfe, ob `<Toaster />` in der App.tsx enthalten ist
- Stelle sicher, dass react-hot-toast installiert ist

### Theme wechselt nicht
- Überprüfe, ob der Theme Store korrekt konfiguriert ist
- Stelle sicher, dass CSS-Variablen definiert sind

### Navigation funktioniert nicht
- Überprüfe, ob die Routen in App.tsx definiert sind
- Stelle sicher, dass React Router korrekt konfiguriert ist
