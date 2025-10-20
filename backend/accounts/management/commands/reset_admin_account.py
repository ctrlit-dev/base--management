"""
Django Management Command: reset_admin_account
==============================================

Löscht den Admin-Account admin@lcree.com und erstellt ihn neu mit den angegebenen Daten.
Dies ist nützlich für das Testen der Passkey-Funktionalität.

Verwendung:
    python manage.py reset_admin_account
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import PasskeyCredential, PasswordResetToken, EmailVerificationToken, UserProfile, UserSession

User = get_user_model()


class Command(BaseCommand):
    help = 'Löscht den Admin-Account admin@lcree.com und erstellt ihn neu'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            default='admin@lcree.com',
            help='E-Mail-Adresse des zu löschenden Accounts (Standard: admin@lcree.com)'
        )
        parser.add_argument(
            '--password',
            type=str,
            default='demo123',
            help='Neues Passwort für den Account (Standard: demo123)'
        )
        parser.add_argument(
            '--first-name',
            type=str,
            default='Dominik',
            help='Vorname des neuen Accounts (Standard: Dominik)'
        )
        parser.add_argument(
            '--last-name',
            type=str,
            default='Tobsch',
            help='Nachname des neuen Accounts (Standard: Tobsch)'
        )

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        first_name = options['first_name']
        last_name = options['last_name']

        self.stdout.write(f"Starte Reset für Account: {email}")

        try:
            # 1. Prüfe ob der Account existiert
            try:
                existing_user = User.objects.get(email=email)
                self.stdout.write(f"Gefundener Account: {existing_user.get_full_name()} ({existing_user.email})")
                
                # 2. Lösche alle zugehörigen Daten
                self.stdout.write("Lösche zugehörige Passkey-Credentials...")
                PasskeyCredential.objects.filter(user=existing_user).delete()
                
                self.stdout.write("Lösche zugehörige Reset-Tokens...")
                PasswordResetToken.objects.filter(user=existing_user).delete()
                
                self.stdout.write("Lösche zugehörige E-Mail-Verifizierungs-Tokens...")
                EmailVerificationToken.objects.filter(user=existing_user).delete()
                
                self.stdout.write("Lösche zugehörige User-Profile...")
                UserProfile.objects.filter(user=existing_user).delete()
                
                self.stdout.write("Lösche zugehörige User-Sessions...")
                UserSession.objects.filter(user=existing_user).delete()
                
                # 3. Lösche den User selbst
                self.stdout.write("Lösche den User-Account...")
                existing_user.delete()
                self.stdout.write(self.style.SUCCESS(f"Account {email} erfolgreich gelöscht"))
                
            except User.DoesNotExist:
                self.stdout.write(f"Account {email} existiert nicht - wird neu erstellt")

            # 4. Erstelle neuen Account
            self.stdout.write("Erstelle neuen Admin-Account...")
            new_user = User.objects.create_superuser(
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role='ADMIN',
                email_verified=True,
                is_active=True
            )
            
            # 5. Erstelle UserProfile
            UserProfile.objects.create(user=new_user)
            
            self.stdout.write(self.style.SUCCESS(
                f"Neuer Admin-Account erfolgreich erstellt:\n"
                f"  Name: {new_user.get_full_name()}\n"
                f"  E-Mail: {new_user.email}\n"
                f"  Passwort: {password}\n"
                f"  Rolle: {new_user.get_role_display()}\n"
                f"  E-Mail verifiziert: {new_user.email_verified}"
            ))
            
            self.stdout.write(
                self.style.WARNING(
                    "Sie können sich jetzt mit diesem Account anmelden und einen Passkey registrieren."
                )
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Fehler beim Reset des Accounts: {str(e)}")
            )
            raise
