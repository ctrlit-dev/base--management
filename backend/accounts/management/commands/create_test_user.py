"""
Management Command: create_test_user
===================================

Erstellt einen Test-Admin-User für die Entwicklung.

Verwendung:
    python manage.py create_test_user
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import UserRole

User = get_user_model()


class Command(BaseCommand):
    help = 'Erstellt einen Test-Admin-User für die Entwicklung'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            default='admin@example.com',
            help='E-Mail-Adresse des Test-Users'
        )
        parser.add_argument(
            '--password',
            type=str,
            default='admin123',
            help='Passwort des Test-Users'
        )
        parser.add_argument(
            '--first-name',
            type=str,
            default='Admin',
            help='Vorname des Test-Users'
        )
        parser.add_argument(
            '--last-name',
            type=str,
            default='User',
            help='Nachname des Test-Users'
        )

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        first_name = options['first_name']
        last_name = options['last_name']

        # Prüfe, ob User bereits existiert
        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.WARNING(f'User mit E-Mail {email} existiert bereits.')
            )
            return

        # Erstelle neuen Admin-User
        user = User.objects.create_user(
            username=email,  # Django benötigt username, verwende email
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=UserRole.ADMIN,
            is_staff=True,
            is_superuser=True,
            is_active=True
        )

        self.stdout.write(
            self.style.SUCCESS(
                f'Test-User erfolgreich erstellt:\n'
                f'  E-Mail: {email}\n'
                f'  Passwort: {password}\n'
                f'  Name: {first_name} {last_name}\n'
                f'  Rolle: {UserRole.ADMIN}'
            )
        )
