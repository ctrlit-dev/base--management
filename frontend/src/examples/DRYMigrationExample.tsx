/**
 * DRY Migration Example
 * ====================
 * 
 * Beispiel für die Migration von wiederholten Styles zu DRY-Komponenten.
 * Zeigt vorher/nachher Vergleich.
 */

import React from 'react';
import { 
  Button, 
  PrimaryButton, 
  SecondaryButton, 
  DangerButton,
  IconButton 
} from '../components/buttons/ButtonComponents';
import { 
  TextInput, 
  EmailInput, 
  PasswordInput,
  InputGroup,
  InputRow 
} from '../components/inputs/InputComponents';
import { 
  Container, 
  Section, 
  Grid, 
  Stack, 
  HStack,
  Center,
  CardLayout 
} from '../components/layout/LayoutComponents';
import { 
  BaseCard, 
  CardWithHeader, 
  StatsCard 
} from '../components/cards/CardComponents';

// VORHER: Wiederholte Styles
const OldComponent = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Alte Implementierung
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500">
              Primärer Button
            </button>
            
            <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 focus:ring-gray-500">
              Sekundärer Button
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input 
                type="text"
                className="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ihr Name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                E-Mail
              </label>
              <input 
                type="email"
                className="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                placeholder="ihre@email.com"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// NACHHER: DRY-Komponenten
const NewComponent = () => {
  return (
    <Container size="lg">
      <CardLayout padding="md" className="mb-8">
        <h2 className="text-lg font-semibold text-primary mb-4">
          Neue DRY-Implementierung
        </h2>
        
        <Stack spacing="md">
          <HStack justify="between">
            <PrimaryButton>
              Primärer Button
            </PrimaryButton>
            
            <SecondaryButton>
              Sekundärer Button
            </SecondaryButton>
          </HStack>
          
          <InputRow columns={2} gap="md">
            <TextInput 
              label="Name"
              placeholder="Ihr Name"
            />
            
            <EmailInput 
              label="E-Mail"
              placeholder="ihre@email.com"
            />
          </InputRow>
        </Stack>
      </CardLayout>
    </Container>
  );
};

// Komplexeres Beispiel mit verschiedenen Komponenten
const ComplexExample = () => {
  return (
    <Container size="xl">
      <Section spacing="lg">
        <Grid columns={3} gap="lg">
          <StatsCard
            title="Benutzer"
            value="1,234"
            change={{ value: "12%", type: "increase" }}
            icon={<div className="w-8 h-8 bg-blue-500 rounded-full" />}
          />
          
          <StatsCard
            title="Bestellungen"
            value="567"
            change={{ value: "5%", type: "decrease" }}
            icon={<div className="w-8 h-8 bg-green-500 rounded-full" />}
          />
          
          <StatsCard
            title="Umsatz"
            value="€12,345"
            change={{ value: "8%", type: "increase" }}
            icon={<div className="w-8 h-8 bg-purple-500 rounded-full" />}
          />
        </Grid>
        
        <CardWithHeader
          title="Benutzerverwaltung"
          subtitle="Verwalten Sie Benutzer und deren Berechtigungen"
          className="mt-8"
        >
          <InputGroup>
            <InputRow columns={2} gap="md">
              <TextInput 
                label="Vorname"
                placeholder="Max"
                required
              />
              
              <TextInput 
                label="Nachname"
                placeholder="Mustermann"
                required
              />
            </InputRow>
            
            <EmailInput 
              label="E-Mail-Adresse"
              placeholder="max.mustermann@example.com"
              required
            />
            
            <PasswordInput 
              label="Passwort"
              placeholder="Sicheres Passwort"
              required
            />
          </InputGroup>
          
          <HStack justify="end" spacing="md" className="mt-6">
            <SecondaryButton>
              Abbrechen
            </SecondaryButton>
            
            <PrimaryButton>
              Benutzer erstellen
            </PrimaryButton>
          </HStack>
        </CardWithHeader>
      </Section>
    </Container>
  );
};

export { OldComponent, NewComponent, ComplexExample };
