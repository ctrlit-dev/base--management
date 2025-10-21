"""
LCREE User Cleanup and Creation Command
=======================================

Löscht alle bestehenden Benutzer und erstellt neue Benutzer mit den korrekten Rollen.

Verwendung:
python manage.py cleanup_and_create_users

Warnung: Dieses Kommando löscht ALLE bestehenden Benutzer!
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from accounts.models import UserRole
import logging

logger = logging.getLogger(__name__)

User = get_user_model()


class Command(BaseCommand):
    help = 'Löscht alle Benutzer und erstellt neue Benutzer mit korrekten Rollen'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Zeigt nur an, was gelöscht/erstellt würde, ohne Änderungen vorzunehmen',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN MODE - Keine Änderungen werden vorgenommen')
            )
        
        with transaction.atomic():
            if dry_run:
                # Zeige nur an, was passieren würde
                users = User.objects.all()
                self.stdout.write(f'Gefunden: {users.count()} Benutzer zum Löschen')
                
                for user in users:
                    self.stdout.write(f'  - {user.email} ({user.role})')
                
                self.stdout.write('\nNeue Benutzer, die erstellt würden:')
                test_users = self.get_test_users()
                for user_data in test_users:
                    self.stdout.write(f'  - {user_data["email"]} ({user_data["role"]})')
            else:
                # Lösche alle bestehenden Benutzer
                deleted_count = User.objects.count()
                User.objects.all().delete()
                self.stdout.write(
                    self.style.SUCCESS(f'Gelöscht: {deleted_count} Benutzer')
                )
                
                # Erstelle neue Benutzer
                created_users = self.create_test_users()
                self.stdout.write(
                    self.style.SUCCESS(f'Erstellt: {len(created_users)} neue Benutzer')
                )
                
                # Zeige die erstellten Benutzer an
                self.stdout.write('\nErstellte Benutzer:')
                for user in created_users:
                    self.stdout.write(f'  - {user.email} ({user.role}) - Passwort: {user.raw_password}')

    def get_test_users(self):
        """Definiert die Test-Benutzer mit korrekten Rollen"""
        return [
            {
                'email': 'superadmin@lcree.de',
                'first_name': 'Super',
                'last_name': 'Admin',
                'role': UserRole.SUPER_ADMIN,
                'password': 'superadmin123',
                'is_active': True,
                'is_staff': True,
                'is_superuser': True,
            },
            {
                'email': 'admin@lcree.de',
                'first_name': 'System',
                'last_name': 'Admin',
                'role': UserRole.ADMIN,
                'password': 'admin123',
                'is_active': True,
                'is_staff': True,
                'is_superuser': False,
            },
            {
                'email': 'manager@lcree.de',
                'first_name': 'Team',
                'last_name': 'Manager',
                'role': UserRole.MANAGER,
                'password': 'manager123',
                'is_active': True,
                'is_staff': False,
                'is_superuser': False,
            },
            {
                'email': 'user@lcree.de',
                'first_name': 'Standard',
                'last_name': 'Benutzer',
                'role': UserRole.USER,
                'password': 'user123',
                'is_active': True,
                'is_staff': False,
                'is_superuser': False,
            },
            {
                'email': 'guest@lcree.de',
                'first_name': 'Gast',
                'last_name': 'Benutzer',
                'role': UserRole.GUEST,
                'password': 'guest123',
                'is_active': True,
                'is_staff': False,
                'is_superuser': False,
            },
        ]

    def create_test_users(self):
        """Erstellt die Test-Benutzer"""
        created_users = []
        test_users = self.get_test_users()
        
        for user_data in test_users:
            # Speichere das Passwort vor dem Erstellen
            password = user_data.pop('password')
            
            # Erstelle den Benutzer
            user = User.objects.create(
                email=user_data['email'],
                username=user_data['email'],  # Setze username = email
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                role=user_data['role'],
                is_active=user_data['is_active'],
                is_staff=user_data['is_staff'],
                is_superuser=user_data['is_superuser'],
            )
            user.set_password(password)
            user.save()
            
            # Füge das Passwort für die Anzeige hinzu
            user.raw_password = password
            created_users.append(user)
            
            logger.info(f'Benutzer erstellt: {user.email} ({user.role})')
        
        return created_users
