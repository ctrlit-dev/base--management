# DRY-Komponenten Dokumentation

## Übersicht

Diese Dokumentation beschreibt die neuen wiederverwendbaren Komponenten, die entwickelt wurden, um Code-Duplikation zu reduzieren und Konsistenz in der UI zu gewährleisten.

## Button-Komponenten

### Verfügbare Button-Varianten

#### PrimaryButton
```tsx
import { PrimaryButton } from '../components/buttons/ButtonComponents';

<PrimaryButton onClick={handleClick}>
  Primärer Button
</PrimaryButton>
```

**Verwendung**: Hauptaktionen, wichtige Buttons
**Styling**: Blaue Hintergrundfarbe mit weißem Text

#### SecondaryButton
```tsx
import { SecondaryButton } from '../components/buttons/ButtonComponents';

<SecondaryButton onClick={handleClick}>
  Sekundärer Button
</SecondaryButton>
```

**Verwendung**: Sekundäre Aktionen, weniger wichtige Buttons
**Styling**: Grauer Hintergrund mit dunklem Text

#### DangerButton
```tsx
import { DangerButton } from '../components/buttons/ButtonComponents';

<DangerButton onClick={handleDelete}>
  Löschen
</DangerButton>
```

**Verwendung**: Gefährliche Aktionen (Löschen, Zurücksetzen)
**Styling**: Rote Hintergrundfarbe mit weißem Text

#### SuccessButton
```tsx
import { SuccessButton } from '../components/buttons/ButtonComponents';

<SuccessButton onClick={handleSave}>
  Speichern
</SuccessButton>
```

**Verwendung**: Erfolgreiche Aktionen (Speichern, Bestätigen)
**Styling**: Grüne Hintergrundfarbe mit weißem Text

#### WarningButton
```tsx
import { WarningButton } from '../components/buttons/ButtonComponents';

<WarningButton onClick={handleWarning}>
  Warnung
</WarningButton>
```

**Verwendung**: Warnungen, wichtige Hinweise
**Styling**: Gelbe Hintergrundfarbe mit weißem Text

### Button-Props

```tsx
interface BaseButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  state?: 'default' | 'loading' | 'success' | 'error';
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  animated?: boolean;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```

### Button-Beispiele

#### Mit Icon
```tsx
<PrimaryButton 
  leftIcon={<SaveIcon className="w-4 h-4" />}
  onClick={handleSave}
>
  Speichern
</PrimaryButton>
```

#### Mit Loading-State
```tsx
<PrimaryButton 
  loading={isLoading}
  loadingText="Wird gespeichert..."
  onClick={handleSave}
>
  Speichern
</PrimaryButton>
```

#### Vollbreite Button
```tsx
<PrimaryButton 
  fullWidth
  onClick={handleSubmit}
>
  Absenden
</PrimaryButton>
```

## Input-Komponenten

### Verfügbare Input-Typen

#### TextInput
```tsx
import { TextInput } from '../components/inputs/InputComponents';

<TextInput 
  label="Name"
  placeholder="Ihr Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>
```

#### EmailInput
```tsx
import { EmailInput } from '../components/inputs/InputComponents';

<EmailInput 
  label="E-Mail"
  placeholder="ihre@email.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

#### PasswordInput
```tsx
import { PasswordInput } from '../components/inputs/InputComponents';

<PasswordInput 
  label="Passwort"
  placeholder="Sicheres Passwort"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  showPassword={showPassword}
  onTogglePassword={() => setShowPassword(!showPassword)}
/>
```

#### BaseSelect
```tsx
import { BaseSelect } from '../components/inputs/InputComponents';

<BaseSelect
  label="Auswahl"
  value={selectedValue}
  onChange={setSelectedValue}
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ]}
/>
```

### Input-Props

```tsx
interface BaseInputProps {
  label?: string;
  error?: string;
  success?: boolean;
  loading?: boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  state?: 'default' | 'error' | 'success' | 'loading';
  fullWidth?: boolean;
  animated?: boolean;
  className?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
```

### Input-Beispiele

#### Mit Error-State
```tsx
<TextInput 
  label="E-Mail"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error="Bitte geben Sie eine gültige E-Mail ein"
/>
```

#### Mit Success-State
```tsx
<TextInput 
  label="Benutzername"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  success={true}
  helperText="Benutzername ist verfügbar"
/>
```

#### Mit Icon
```tsx
<EmailInput 
  label="E-Mail"
  leftIcon={<EnvelopeIcon className="w-5 h-5" />}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

## Layout-Komponenten

### Container
```tsx
import { Container } from '../components/layout/LayoutComponents';

<Container size="lg" padding={true}>
  <h1>Mein Inhalt</h1>
</Container>
```

### Grid
```tsx
import { Grid } from '../components/layout/LayoutComponents';

<Grid columns={3} gap="md" responsive={true}>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Grid>
```

### Flex
```tsx
import { Flex } from '../components/layout/LayoutComponents';

<Flex direction="row" justify="between" align="center" gap="md">
  <div>Links</div>
  <div>Rechts</div>
</Flex>
```

### Stack
```tsx
import { Stack } from '../components/layout/LayoutComponents';

<Stack spacing="md" align="stretch">
  <div>Element 1</div>
  <div>Element 2</div>
  <div>Element 3</div>
</Stack>
```

## Utility-Klassen

### Card-Utilities
```css
.card-base          /* Basis-Card-Styling */
.card-hover         /* Card mit Hover-Effekt */
.card-padding-sm    /* Kleine Polsterung */
.card-padding-md    /* Mittlere Polsterung */
.card-padding-lg    /* Große Polsterung */
```

### Button-Utilities
```css
.btn-base           /* Basis-Button-Styling */
.btn-primary        /* Primärer Button */
.btn-secondary      /* Sekundärer Button */
.btn-danger         /* Gefährlicher Button */
.btn-success        /* Erfolgs-Button */
.btn-sm             /* Kleine Größe */
.btn-lg             /* Große Größe */
```

### Form-Utilities
```css
.form-input-base    /* Basis-Input-Styling */
.form-input         /* Standard-Input */
.form-input-error   /* Input mit Fehler */
.form-input-success /* Input mit Erfolg */
```

### Toggle-Button-Utilities
```css
.toggle-base        /* Basis-Toggle-Styling */
.toggle-active      /* Aktiver Toggle (Grün) */
.toggle-inactive    /* Inaktiver Toggle (Grau) */
.toggle-sm          /* Kleine Größe */
.toggle-md          /* Mittlere Größe */
.toggle-lg          /* Große Größe */
.toggle-knob-sm     /* Kleiner Toggle-Knopf */
.toggle-knob-md     /* Mittlerer Toggle-Knopf */
.toggle-knob-lg     /* Großer Toggle-Knopf */
```

### Session-Button-Utilities
```css
.session-button-orange  /* Orange Session-Button */
.session-button-red     /* Rote Session-Button */
```

### Passkey-Button-Utilities
```css
.btn-passkey-primary    /* Primärer Passkey-Button */
.btn-passkey-cancel     /* Passkey-Cancel-Button */
```

### Secondary-Button-Utilities
```css
.btn-secondary-outline  /* Outline Secondary-Button */
```

### Layout-Utilities
```css
.flex-center        /* Flex mit Zentrierung */
.flex-between       /* Flex mit Space-Between */
.flex-start         /* Flex mit Start-Ausrichtung */
.grid-responsive    /* Responsive Grid */
.grid-responsive-2  /* 2-Spalten Grid */
.grid-responsive-4  /* 4-Spalten Grid */
```

### Background-Utilities
```css
.bg-card            /* Card-Hintergrund */
.bg-card-secondary  /* Sekundärer Card-Hintergrund */
.bg-card-tertiary   /* Tertiärer Card-Hintergrund */
```

### Text-Utilities
```css
.text-primary       /* Primärer Text */
.text-secondary     /* Sekundärer Text */
.text-tertiary      /* Tertiärer Text */
```

## Migration-Guide

### Vorher (wiederholte Styles)
```tsx
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
  Speichern
</button>
```

### Nachher (DRY-Komponente)
```tsx
<PrimaryButton onClick={handleSave}>
  Speichern
</PrimaryButton>
```

### Vorher (wiederholte Card-Styles)
```tsx
<div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
  <h2>Card-Titel</h2>
</div>
```

### Nachher (Utility-Klasse)
```tsx
<div className="card-base card-padding-md">
  <h2>Card-Titel</h2>
</div>
```

## Best Practices

1. **Verwenden Sie immer die DRY-Komponenten** statt wiederholter Styles
2. **Kombinieren Sie Utility-Klassen** für komplexere Layouts
3. **Verwenden Sie die richtige Button-Variante** für den Kontext
4. **Nutzen Sie die Input-Komponenten** für konsistente Formulare
5. **Verwenden Sie Layout-Komponenten** für responsive Designs

## ESLint-Regeln

Die folgenden ESLint-Regeln wurden hinzugefügt, um DRY-Konformität zu gewährleisten:

- Verhindert wiederholte Button-Styles
- Verhindert wiederholte Card-Styles
- Verhindert wiederholte Flex-Styles
- Verhindert wiederholte Input-Styles
- Verhindert zu lange className-Strings

## Testing

Alle DRY-Komponenten haben automatisierte Tests, die sicherstellen, dass:
- Die Komponenten korrekt rendern
- Props korrekt verarbeitet werden
- Events korrekt ausgelöst werden
- Accessibility-Anforderungen erfüllt werden
