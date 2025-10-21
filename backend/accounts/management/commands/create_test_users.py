"""
LCREE Create Test Users Management Command
==========================================

Erstellt Test-Benutzer für die Entwicklung.

Verwendung:
    python manage.py create_test_users

Erstellt:
- Test-Benutzer mit verschiedenen Rollen für Entwicklung
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import UserRole

User = get_user_model()


class Command(BaseCommand):
    help = 'Erstellt Test-Benutzer für die Entwicklung'

    def handle(self, *args, **options):
        self.stdout.write('Erstelle Test-Benutzer...')
        
        # Test-Benutzer Daten
        users_data = [
            {
                'email': 'test@example.com',
                'first_name': 'Test',
                'last_name': 'User',
                'role': UserRole.SUPER_ADMIN,
                'is_staff': True,
                'is_superuser': True,
            },
            {
                'email': 'admin@example.com',
                'first_name': 'Admin',
                'last_name': 'User',
                'role': UserRole.ADMIN,
                'is_staff': True,
                'is_superuser': False,
            },
            {
                'email': 'manager@example.com',
                'first_name': 'Manager',
                'last_name': 'User',
                'role': UserRole.MANAGER,
            },
            {
                'email': 'user@example.com',
                'first_name': 'Standard',
                'last_name': 'User',
                'role': UserRole.USER,
            },
            {
                'email': 'guest@example.com',
                'first_name': 'Guest',
                'last_name': 'User',
                'role': UserRole.GUEST,
            },
        ]
        
        created_count = 0
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults={
                    **user_data,
                    'username': user_data['email']  # Username = Email für Custom User Model
                }
            )
            if created:
                user.set_password('test123')
                user.save()
                created_count += 1
                self.stdout.write(f'[OK] Benutzer erstellt: {user.email} ({user.role})')
            else:
                self.stdout.write(f'[EXISTS] Benutzer existiert bereits: {user.email} ({user.role})')
        
        self.stdout.write(
            self.style.SUCCESS(f'Test-Benutzer erfolgreich erstellt! ({created_count} neue Benutzer)')
        )
        
        # Zeige Login-Informationen
        self.stdout.write('\n' + '='*50)
        self.stdout.write('LOGIN-INFORMATIONEN:')
        self.stdout.write('='*50)
        for user_data in users_data:
            self.stdout.write(f'Email: {user_data["email"]}')
            self.stdout.write(f'Passwort: test123')
            self.stdout.write(f'Rolle: {user_data["role"]}')
            self.stdout.write('-' * 30)
