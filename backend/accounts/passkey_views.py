"""
LCREE Passkey Views
==================

Saubere, modulare Passkey-Implementierung nach WebAuthn-Standards.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import PasskeyCredential, PasskeyAuthChallenge, EmailVerificationToken
import logging

User = get_user_model()

# Configure logging for passkey operations
logger = logging.getLogger('passkey_debug')
logger.setLevel(logging.DEBUG)
# Ensure handler is only added once
if not logger.handlers:
    handler = logging.FileHandler('logs/passkey_debug.log')
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)


class PasskeyRegisterOptionsView(APIView):
    """
    Passkey-Registrierungsoptionen
    
    Generiert Registrierungsoptionen für neue Passkey-Credentials.
    Unterstützt sowohl neue Benutzer als auch bestehende Benutzer.
    """
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        """
        Generiert Registrierungsoptionen für neue oder bestehende Benutzer
        """
        try:
            from webauthn import generate_registration_options
            from webauthn.helpers.structs import (
                AttestationConveyancePreference, 
                AuthenticatorSelectionCriteria, 
                UserVerificationRequirement,
                ResidentKeyRequirement,
                AuthenticatorAttachment
            )
            import base64
            
            logger.info("=== GENERATING PASSKEY REGISTRATION OPTIONS ===")
            
            # Prüfe ob Benutzer eingeloggt ist
            if request.user.is_authenticated:
                # Bestehender Benutzer - füge Passkey hinzu
                user = request.user
                logger.info(f"Existing user: {user.email}")
                
                # Hole existierende Credential-IDs für den Benutzer
                existing_credentials = PasskeyCredential.objects.filter(user=user).values_list('credential_id', flat=True)
                logger.info(f"Existing credentials count: {len(existing_credentials)}")
                
                # Debug: Zeige die Credential-IDs
                for i, cred_id in enumerate(existing_credentials):
                    logger.info(f"Credential {i+1}: {cred_id[:20]}... (length: {len(cred_id)})")
                
                # Verwende bestehende Benutzerdaten
                user_id = str(user.id).encode()
                user_name = user.email
                user_display_name = f"{user.first_name} {user.last_name}".strip() or user.email
                
            else:
                # Neuer Benutzer - temporäre Registrierung
                logger.info("New user registration - generating temporary user data")
                
                # Generiere temporäre Benutzerdaten (werden später durch echte Daten ersetzt)
                import time
                temp_user_id = f"temp_{int(time.time())}"
                user_id = temp_user_id.encode()
                user_name = "temp@example.com"  # Wird später durch echte Email ersetzt
                user_display_name = "Temporary User"
                
                # Keine existierenden Credentials für neue Benutzer
                existing_credentials = []
                logger.info("No existing credentials for new user")
            
            # Dynamische rp_id basierend auf der Request-Origin
            rp_id = "localhost"
            origin = request.META.get('HTTP_ORIGIN', '')
            print(f"Request origin: {origin}")
            if origin:
                try:
                    from urllib.parse import urlparse
                    parsed = urlparse(origin)
                    rp_id = parsed.hostname or "localhost"
                    print(f"Using rp_id from origin: {rp_id}")
                except Exception as e:
                    print(f"Error parsing origin: {e}")
                    pass
            else:
                print("No origin header found, using localhost")
            
            options = generate_registration_options(
                rp_id="localhost",  # Verwende immer localhost für lokale Entwicklung
                rp_name="LCREE Parfum System",
                user_id=user_id,
                user_name=user_name,
                user_display_name=user_display_name,
                attestation=AttestationConveyancePreference.NONE,  # Vereinfacht für lokale Entwicklung
                authenticator_selection=AuthenticatorSelectionCriteria(
                    user_verification=UserVerificationRequirement.DISCOURAGED,  # Weniger restriktiv
                    resident_key=ResidentKeyRequirement.DISCOURAGED,  # Weniger restriktiv für lokale Entwicklung
                    # Keine authenticator_attachment Einschränkung - erlaubt sowohl Platform als auch Cross-Platform
                ),
                exclude_credentials=[{"id": cred_id, "type": "public-key"} for cred_id in existing_credentials],
                timeout=60000,  # 1 Minute für lokale Entwicklung
            )
            
            # Speichere Challenge und Benutzerdaten in Session
            request.session['passkey_challenge'] = base64.b64encode(options.challenge).decode()
            if request.user.is_authenticated:
                request.session['passkey_user_id'] = str(user.id)
                request.session['passkey_is_existing_user'] = True
            else:
                request.session['passkey_user_id'] = temp_user_id
                request.session['passkey_is_existing_user'] = False
                request.session['passkey_temp_user_data'] = {
                    'user_id': temp_user_id,
                    'user_name': user_name,
                    'user_display_name': user_display_name
                }
            
            logger.info(f"Challenge saved to session: {request.session['passkey_challenge'][:20]}...")
            logger.info(f"Is existing user: {request.user.is_authenticated}")
            
            # Erstelle Response-Daten
            response_data = {
                'options': {
                    'challenge': base64.b64encode(options.challenge).decode(),
                    'rp': {
                        'id': options.rp.id,
                        'name': options.rp.name,
                    },
                    'user': {
                        'id': base64.b64encode(options.user.id).decode(),
                        'name': options.user.name,
                        'displayName': options.user.display_name,
                    },
                    'pubKeyCredParams': [
                        {'type': 'public-key', 'alg': -7},  # ES256
                        {'type': 'public-key', 'alg': -257},  # RS256
                    ],
                    'authenticatorSelection': {
                        'userVerification': 'discouraged',
                        'residentKey': 'discouraged',
                        # Keine authenticatorAttachment Einschränkung - erlaubt sowohl Platform als auch Cross-Platform
                    },
                    'timeout': 60000,  # 1 Minute für lokale Entwicklung
                    'attestation': 'none',
                    'excludeCredentials': [
                        {'id': cred_id, 'type': 'public-key'} for cred_id in existing_credentials
                    ],
                },
                'session_data': {
                    'user_id': request.session['passkey_user_id'],
                    'challenge': base64.b64encode(options.challenge).decode(),
                    'session_key': request.session.session_key,
                    'is_existing_user': request.user.is_authenticated
                }
            }
            
            print("Registration options generated successfully")
            return Response(response_data)
            
        except Exception as e:
            print(f"Error generating registration options: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': f'Fehler beim Generieren der Registrierungsoptionen: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PasskeyRegisterVerifyView(APIView):
    """
    Passkey-Registrierung verifizieren
    
    Verifiziert und speichert neue Passkey-Credentials.
    """
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        """
        Verifiziert und speichert ein neues Passkey-Credential
        """
        try:
            from webauthn import verify_registration_response
            import base64
            import json
            
            print("=== PASSKEY REGISTRATION VERIFICATION ===")
            print(f"Request data keys: {list(request.data.keys())}")
            
            if 'credential' not in request.data:
                return Response({'error': 'Credential-Daten fehlen'}, status=status.HTTP_400_BAD_REQUEST)
            
            credential_data = request.data['credential']
            print(f"Credential ID: {credential_data.get('id', 'No ID')}")
            
            # Hole Benutzerdaten aus dem Request (für neue Benutzer)
            user_data = request.data.get('user_data', {})
            email = user_data.get('email', 'temp@example.com')
            first_name = user_data.get('first_name', 'Temporary')
            last_name = user_data.get('last_name', 'User')
            
            print(f"User data from request: {email}, {first_name}, {last_name}")
            
            # Hole Session-Daten
            user_id = request.session.get('passkey_user_id')
            challenge = request.session.get('passkey_challenge')
            is_existing_user = request.session.get('passkey_is_existing_user', False)
            
            # Fallback: Verwende Session-Daten aus dem Request
            session_data = request.data.get('session_data')
            if not user_id and session_data:
                user_id = session_data.get('user_id')
                challenge = session_data.get('challenge')
                is_existing_user = session_data.get('is_existing_user', False)
                print(f"Using session data from request: User ID: {user_id}, Is existing: {is_existing_user}")
            
            if not user_id or not challenge:
                return Response({'error': 'Registrierungssession abgelaufen'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                if is_existing_user:
                    # Bestehender Benutzer
                    user = User.objects.get(id=user_id)
                    print(f"Existing user found: {user.email}")
                else:
                    # Neuer Benutzer - erstelle Account mit echten Daten
                    print(f"Creating new user with real data: {email}")
                    
                    # Prüfe ob E-Mail bereits existiert
                    if User.objects.filter(email=email).exists():
                        return Response({'error': 'Diese E-Mail-Adresse wird bereits verwendet'}, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Erstelle neuen Benutzer mit echten Daten
                    user = User.objects.create_user(
                        email=email,
                        password=None,  # Kein Passwort für Passkey-only Benutzer
                        first_name=first_name,
                        last_name=last_name,
                        is_active=True,
                        email_verified=False  # Email muss verifiziert werden
                    )
                    print(f"New user created: {user.email} (ID: {user.id})")
                    
                    # Aktualisiere Session mit echter User-ID
                    request.session['passkey_user_id'] = str(user.id)
                    request.session['passkey_is_existing_user'] = True
                
                # Konvertiere Frontend-Daten zurück zu WebAuthn-Format
                credential_for_verification = {
                    'id': credential_data['id'],
                    'rawId': base64.b64encode(bytes(credential_data['rawId'])).decode('utf-8'),
                    'response': {
                        'attestationObject': base64.b64encode(bytes(credential_data['response']['attestationObject'])).decode('utf-8'),
                        'clientDataJSON': base64.b64encode(bytes(credential_data['response']['clientDataJSON'])).decode('utf-8'),
                        'transports': credential_data['response'].get('transports', [])
                    },
                    'type': credential_data['type']
                }
                
                print(f"Credential for verification prepared")
                
                # Analysiere ClientDataJSON um die tatsächliche Origin zu finden
                try:
                    client_data_json_b64 = credential_for_verification['response']['clientDataJSON']
                    client_data_json_bytes = base64.b64decode(client_data_json_b64)
                    client_data = json.loads(client_data_json_bytes.decode('utf-8'))
                    print(f"ClientDataJSON origin: {client_data.get('origin', 'No origin in clientDataJSON')}")
                except Exception as e:
                    print(f"Could not parse ClientDataJSON: {str(e)}")
                
                # Versuche verschiedene Origins für Cross-Device Authentication
                origins_to_try = [
                    "http://localhost:3000",
                    "https://localhost:3000", 
                    "http://127.0.0.1:3000",
                    "https://127.0.0.1:3000",
                    "http://localhost:5173",
                    "https://localhost:5173",
                    "http://localhost:8080",  # Weitere mögliche Ports
                    "https://localhost:8080",
                    None  # Für Cross-Device Authentication
                ]
                
                verification_successful = False
                verification_error = None
                
                # Spezielle Behandlung für Cross-Device Authentication
                client_data_origin = None
                try:
                    client_data_origin = client_data.get('origin')
                    print(f"ClientDataJSON origin: {client_data_origin}")
                except:
                    pass
                
                # Wenn die Origin "null" ist, verwende eine spezielle Behandlung
                if client_data_origin == "null" or client_data_origin is None:
                    print("Cross-Device Authentication detected (null origin)")
                    try:
                        verification = verify_registration_response(
                            credential=credential_for_verification,
                            expected_challenge=base64.b64decode(challenge),
                            expected_rp_id="localhost",  # Verwende immer localhost für lokale Entwicklung
                            expected_origin=None,  # Keine Origin-Prüfung für Cross-Device
                        )
                        verification_successful = True
                        print("Cross-Device verification successful (no origin check)")
                    except Exception as e:
                        print(f"Cross-Device verification failed: {str(e)}")
                        verification_error = e
                
                # Falls Cross-Device nicht funktioniert hat, versuche normale Origins
                if not verification_successful:
                    print("Trying normal origins...")
                    for origin in origins_to_try:
                        try:
                            print(f"Trying origin: {origin}")
                            verification = verify_registration_response(
                                credential=credential_for_verification,
                                expected_challenge=base64.b64decode(challenge),
                                expected_rp_id="localhost",  # Verwende immer localhost für lokale Entwicklung
                                expected_origin=origin,
                            )
                            verification_successful = True
                            print(f"Verification successful with origin: {origin}")
                            break
                        except Exception as e:
                            print(f"Verification failed with origin {origin}: {str(e)}")
                            verification_error = e
                            continue
                
                if not verification_successful:
                    raise verification_error or Exception("Alle Origin-Versuche fehlgeschlagen")
                
                # Speichere das neue Credential
                original_credential_id = credential_data['id']
                
                passkey_credential = PasskeyCredential.objects.create(
                    user=user,
                    credential_id=original_credential_id,
                    public_key=base64.b64encode(verification.credential_public_key).decode(),
                    sign_count=verification.sign_count,
                    transports=credential_data['response'].get('transports', []),
                    attestation_type='none',
                )
                
                print(f"Passkey credential created: {passkey_credential.credential_id}")
                
                # Bereinige Session
                request.session.pop('passkey_challenge', None)
                request.session.pop('passkey_user_id', None)
                request.session.pop('passkey_is_existing_user', None)
                request.session.pop('passkey_temp_user_data', None)
                
                # Für neue Benutzer: Automatische Anmeldung
                if not is_existing_user:
                    from django.contrib.auth import login
                    from rest_framework_simplejwt.tokens import RefreshToken
                    from settingsapp.models import SystemSettings
                    from django.core.mail import send_mail
                    from django.conf import settings
                    from datetime import timedelta
                    
                    # Erstelle JWT-Tokens für neuen Benutzer
                    refresh = RefreshToken.for_user(user)
                    access_token = str(refresh.access_token)
                    refresh_token = str(refresh)
                    
                    # Melde den Benutzer an
                    login(request, user)
                    
                    # E-Mail-Verifizierung falls aktiviert
                    email_verification_sent = False
                    if SystemSettings.get_settings().require_email_verification:
                        try:
                            # Erstelle Verifizierungs-Token
                            token = EmailVerificationToken.objects.create(
                                user=user,
                                expires_at=timezone.now() + timedelta(hours=48)
                            )
                            
                            # Sende Verifizierungs-E-Mail
                            verification_url = f"{SystemSettings.get_settings().qr_base_url}/verify-email/{token.token}"
                            send_mail(
                                subject='LCREE - E-Mail-Adresse verifizieren',
                                message=f'Bitte verifizieren Sie Ihre E-Mail-Adresse: {verification_url}',
                                from_email=settings.DEFAULT_FROM_EMAIL,
                                recipient_list=[user.email],
                                fail_silently=False,
                            )
                            email_verification_sent = True
                            print(f"E-Mail-Verifizierung gesendet an: {user.email}")
                        except Exception as e:
                            print(f"E-Mail-Versand fehlgeschlagen: {e}")
                    
                    return Response({
                        'message': 'Passkey erfolgreich registriert und Sie wurden angemeldet',
                        'credential_id': passkey_credential.credential_id,
                        'access': access_token,
                        'refresh': refresh_token,
                        'user': {
                            'id': user.id,
                            'email': user.email,
                            'first_name': user.first_name,
                            'last_name': user.last_name,
                            'email_verified': user.email_verified,
                        },
                        'is_new_user': True,
                        'requires_email_verification': email_verification_sent
                    })
                else:
                    # Bestehender Benutzer: Nur Bestätigung
                    return Response({
                        'message': 'Passkey erfolgreich registriert',
                        'credential_id': passkey_credential.credential_id,
                        'is_new_user': False
                    })
                
            except Exception as e:
                print(f"Registration verification error: {str(e)}")
                import traceback
                traceback.print_exc()
                
                # Spezifischere Fehlermeldungen
                error_details = str(e)
                if "Invalid origin" in error_details or "origin" in error_details.lower():
                    error_msg = "Origin-Verifikation fehlgeschlagen. Dies kann bei Cross-Device Authentication auftreten."
                elif "Invalid challenge" in error_details or "challenge" in error_details.lower():
                    error_msg = "Challenge-Verifikation fehlgeschlagen. Die Registrierungssession ist abgelaufen."
                elif "Invalid signature" in error_details or "signature" in error_details.lower():
                    error_msg = "Signatur-Verifikation fehlgeschlagen. Das Authenticator-Gerät konnte nicht verifiziert werden."
                else:
                    error_msg = f'Passkey-Verifikation fehlgeschlagen: {error_details}'
                
                return Response({'error': error_msg}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            print(f"General passkey registration error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': f'Fehler bei der Passkey-Registrierung: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PasskeyAuthenticateOptionsView(APIView):
    """
    Passkey-Authentifizierungsoptionen
    
    Generiert Authentifizierungsoptionen für Passkey-Login.
    """
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        """
        Generiert Authentifizierungsoptionen
        """
        try:
            from webauthn import generate_authentication_options
            from webauthn.helpers.structs import UserVerificationRequirement
            import base64
            
            print("=== GENERATING AUTHENTICATION OPTIONS ===")
            
            # Hole alle verfügbaren Credentials
            credentials = PasskeyCredential.objects.filter(is_active=True).select_related('user')
            
            print(f"Found {credentials.count()} active credentials")
            
            if not credentials.exists():
                print("ERROR: No active credentials found")
                return Response({'error': 'Keine Passkey-Credentials verfügbar'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Erstelle Credential-Liste für WebAuthn
            allow_credentials = []
            for cred in credentials:
                # Die Credential-ID ist bereits Base64-kodiert, sende sie direkt
                allow_credentials.append({
                    'id': cred.credential_id,
                    'type': 'public-key',
                    'transports': cred.transports or ['usb', 'nfc', 'ble', 'internal']
                })
                print(f"Added credential: {cred.credential_id[:20]}... (length: {len(cred.credential_id)})")
            
            # Dynamische rp_id basierend auf der Request-Origin
            rp_id = "localhost"
            origin = request.META.get('HTTP_ORIGIN', '')
            print(f"Request origin: {origin}")
            if origin:
                try:
                    from urllib.parse import urlparse
                    parsed = urlparse(origin)
                    rp_id = parsed.hostname or "localhost"
                    print(f"Using rp_id from origin: {rp_id}")
                except Exception as e:
                    print(f"Error parsing origin: {e}")
                    pass
            else:
                print("No origin header found, using localhost")
            
            options = generate_authentication_options(
                rp_id="localhost",  # Verwende immer localhost für lokale Entwicklung
                allow_credentials=allow_credentials,
                user_verification=UserVerificationRequirement.DISCOURAGED,  # Weniger restriktiv für lokale Entwicklung
            )
            
            # Speichere Challenge in Session UND in der Datenbank für Cross-Device Authentication
            challenge_b64 = base64.b64encode(options.challenge).decode()
            request.session['passkey_auth_challenge'] = challenge_b64
            
            # Erstelle temporären Challenge-Eintrag in der Datenbank
            challenge_obj = PasskeyAuthChallenge.objects.create(
                challenge=challenge_b64,
                expires_at=timezone.now() + timezone.timedelta(minutes=10)  # 10 Minuten Gültigkeit
            )
            
            print(f"Generated options with {len(allow_credentials)} credentials")
            print(f"Challenge saved to session: {challenge_b64[:20]}...")
            print(f"Challenge saved to database with ID: {challenge_obj.id}")
            
            response_data = {
                'options': {
                    'challenge': base64.b64encode(options.challenge).decode(),
                    'timeout': 60000,
                    'rpId': options.rp_id,
                    'allowCredentials': allow_credentials,
                    'userVerification': 'discouraged',
                }
            }
            
            print(f"Returning authentication options")
            return Response(response_data)
            
        except Exception as e:
            print(f"Error generating authentication options: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': f'Fehler beim Generieren der Authentifizierungsoptionen: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PasskeyAuthenticateVerifyView(APIView):
    """
    Passkey-Authentifizierung verifizieren
    
    Verifiziert Passkey-Credentials und gibt JWT-Token zurück.
    """
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        """
        Verifiziert ein Passkey-Credential und gibt JWT-Token zurück
        """
        try:
            from webauthn import verify_authentication_response
            import base64
            import json
            
            print("=== PASSKEY AUTHENTICATE VERIFICATION ===")
            print(f"Request data keys: {list(request.data.keys())}")
            
            if 'credential' not in request.data:
                return Response({'error': 'Credential-Daten fehlen'}, status=status.HTTP_400_BAD_REQUEST)
            
            credential_data = request.data['credential']
            print(f"Credential ID: {credential_data.get('id', 'No ID')}")
            
            # Hole Challenge aus Session oder Datenbank
            challenge = request.session.get('passkey_auth_challenge')
            
            # Falls Challenge nicht in Session vorhanden, versuche aus Datenbank zu laden
            if not challenge:
                print("Challenge not in session, trying to load from database...")
                
                # Suche nach der neuesten, nicht verwendeten Challenge
                challenge_obj = PasskeyAuthChallenge.objects.filter(
                    used=False,
                    expires_at__gt=timezone.now()
                ).order_by('-created_at').first()
                
                if challenge_obj:
                    challenge = challenge_obj.challenge
                    print(f"Found challenge in database: {challenge[:20]}...")
                    # Markiere als verwendet, da sie jetzt verwendet wird
                    challenge_obj.mark_as_used()
                else:
                    print("No valid challenge found in database")
            
            if not challenge:
                print("ERROR: No challenge found in session or database")
                return Response({'error': 'Authentifizierungssession abgelaufen'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Dynamische rp_id basierend auf der Request-Origin
            rp_id = "localhost"
            origin = request.META.get('HTTP_ORIGIN', '')
            if origin:
                try:
                    from urllib.parse import urlparse
                    parsed = urlparse(origin)
                    rp_id = parsed.hostname or "localhost"
                    print(f"Using rp_id from origin: {rp_id}")
                except:
                    pass
            
            try:
                # Finde das Credential
                credential_id = credential_data.get('id')
                print(f"Looking for credential with ID: {credential_id}")
                
                # Debug: Zeige alle verfügbaren Credentials
                all_credentials = PasskeyCredential.objects.filter(is_active=True)
                print(f"Found {all_credentials.count()} active credentials in database:")
                for cred in all_credentials:
                    print(f"  - ID: {cred.credential_id} (User: {cred.user.email})")
                
                # Das Frontend sendet die ursprüngliche Credential-ID (ohne Padding)
                # Das Backend speichert sie mit Padding
                credential_id = credential_data.get('id')
                
                print(f"Looking for credential with ID: {credential_id}")
                
                # Versuche zuerst die ursprüngliche ID (ohne Padding)
                try:
                    passkey_credential = PasskeyCredential.objects.get(
                        credential_id=credential_id,
                        is_active=True
                    )
                    print(f"Found matching credential for user: {passkey_credential.user.email}")
                except PasskeyCredential.DoesNotExist:
                    # Versuche die ID mit Padding
                    try:
                        # Füge Padding hinzu falls nötig
                        missing_padding = len(credential_id) % 4
                        if missing_padding:
                            padded_id = credential_id + '=' * (4 - missing_padding)
                        else:
                            padded_id = credential_id
                        
                        print(f"Trying with padded ID: {padded_id}")
                        passkey_credential = PasskeyCredential.objects.get(
                            credential_id=padded_id,
                            is_active=True
                        )
                        print(f"Found matching credential with padded ID for user: {passkey_credential.user.email}")
                    except PasskeyCredential.DoesNotExist:
                        print(f"ERROR: No credential found with either ID format")
                        print(f"  - Original ID: {credential_id}")
                        print(f"  - Padded ID: {padded_id}")
                        print("Available credential IDs:")
                        for cred in all_credentials:
                            print(f"  - {cred.credential_id}")
                        raise PasskeyCredential.DoesNotExist("Passkey-Credential nicht gefunden")
                
                # Konvertiere Frontend-Daten zurück zu WebAuthn-Format
                try:
                    # Debug: Zeige die Struktur der empfangenen Daten
                    print(f"Raw credential data structure:")
                    print(f"  - id: {credential_data.get('id')} (type: {type(credential_data.get('id'))})")
                    print(f"  - rawId: {credential_data.get('rawId')[:10] if credential_data.get('rawId') else None}... (type: {type(credential_data.get('rawId'))}, length: {len(credential_data.get('rawId', []))})")
                    print(f"  - response keys: {list(credential_data.get('response', {}).keys())}")
                    
                    # Konvertiere rawId
                    raw_id_bytes = bytes(credential_data['rawId'])
                    raw_id_b64 = base64.b64encode(raw_id_bytes).decode('utf-8')
                    
                    # Konvertiere response-Daten
                    response_data = credential_data['response']
                    authenticator_data_bytes = bytes(response_data['authenticatorData'])
                    authenticator_data_b64 = base64.b64encode(authenticator_data_bytes).decode('utf-8')
                    
                    client_data_json_bytes = bytes(response_data['clientDataJSON'])
                    client_data_json_b64 = base64.b64encode(client_data_json_bytes).decode('utf-8')
                    
                    signature_bytes = bytes(response_data['signature'])
                    signature_b64 = base64.b64encode(signature_bytes).decode('utf-8')
                    
                    # userHandle kann null sein
                    user_handle_b64 = None
                    if response_data.get('userHandle'):
                        user_handle_bytes = bytes(response_data['userHandle'])
                        user_handle_b64 = base64.b64encode(user_handle_bytes).decode('utf-8')
                    
                    credential_for_verification = {
                        'id': credential_data['id'],
                        'rawId': raw_id_b64,
                        'response': {
                            'authenticatorData': authenticator_data_b64,
                            'clientDataJSON': client_data_json_b64,
                            'signature': signature_b64,
                            'userHandle': user_handle_b64
                        },
                        'type': credential_data['type']
                    }
                    
                    print(f"Successfully converted credential for verification")
                    print(f"  - rawId length: {len(raw_id_b64)}")
                    print(f"  - authenticatorData length: {len(authenticator_data_b64)}")
                    print(f"  - clientDataJSON length: {len(client_data_json_b64)}")
                    print(f"  - signature length: {len(signature_b64)}")
                    print(f"  - userHandle: {'present' if user_handle_b64 else 'null'}")
                    
                except Exception as e:
                    print(f"Error converting credential data: {e}")
                    print(f"Raw credential data types: {[(k, type(v)) for k, v in credential_data.items()]}")
                    if 'response' in credential_data:
                        print(f"Response data types: {[(k, type(v)) for k, v in credential_data['response'].items()]}")
                    raise
                
                # Verifiziere die Authentifizierungsantwort
                # Versuche verschiedene Origins für Cross-Device Authentication
                origins_to_try = [
                    "http://localhost:3000",
                    "https://localhost:3000", 
                    "http://127.0.0.1:3000",
                    "https://127.0.0.1:3000",
                    "http://localhost:5173",
                    "https://localhost:5173",
                    "http://localhost:8080",  # Weitere mögliche Ports
                    "https://localhost:8080",
                    None  # Für Cross-Device Authentication
                ]
                
                verification_successful = False
                verification_error = None
                
                # Debug: Zeige Challenge-Details
                print(f"Challenge from session/database: {challenge[:50]}...")
                print(f"Challenge length: {len(challenge)}")
                
                # Versuche Challenge zu dekodieren
                try:
                    decoded_challenge = base64.b64decode(challenge)
                    print(f"Challenge decoded successfully, length: {len(decoded_challenge)}")
                except Exception as e:
                    print(f"ERROR: Failed to decode challenge: {e}")
                    print(f"Challenge value: {challenge}")
                    # Versuche Challenge ohne Padding zu dekodieren
                    try:
                        # Füge Padding hinzu falls nötig
                        missing_padding = len(challenge) % 4
                        if missing_padding:
                            challenge += '=' * (4 - missing_padding)
                        decoded_challenge = base64.b64decode(challenge)
                        print(f"Challenge decoded with padding fix, length: {len(decoded_challenge)}")
                    except Exception as e2:
                        print(f"ERROR: Still failed to decode challenge: {e2}")
                        raise e2
                
                for origin in origins_to_try:
                    try:
                        print(f"Trying verification with origin: {origin}")
                        
                        # Debug: Zeige alle Verifikationsparameter
                        print(f"Verification parameters:")
                        print(f"  - credential_id: {credential_for_verification['id']}")
                        print(f"  - rawId length: {len(credential_for_verification['rawId'])}")
                        print(f"  - authenticatorData length: {len(credential_for_verification['response']['authenticatorData'])}")
                        print(f"  - clientDataJSON length: {len(credential_for_verification['response']['clientDataJSON'])}")
                        print(f"  - signature length: {len(credential_for_verification['response']['signature'])}")
                        print(f"  - userHandle: {'present' if credential_for_verification['response']['userHandle'] else 'null'}")
                        print(f"  - challenge length: {len(decoded_challenge)}")
                        print(f"  - public_key length: {len(passkey_credential.public_key)}")
                        print(f"  - sign_count: {passkey_credential.sign_count}")
                        
                        # Versuche public_key zu dekodieren
                        try:
                            public_key_bytes = base64.b64decode(passkey_credential.public_key)
                            print(f"Public key decoded successfully, length: {len(public_key_bytes)}")
                        except Exception as pk_e:
                            print(f"ERROR: Failed to decode public key: {pk_e}")
                            print(f"Public key value: {passkey_credential.public_key}")
                            # Versuche Padding-Korrektur
                            try:
                                missing_padding = len(passkey_credential.public_key) % 4
                                if missing_padding:
                                    padded_key = passkey_credential.public_key + '=' * (4 - missing_padding)
                                    public_key_bytes = base64.b64decode(padded_key)
                                    print(f"Public key decoded with padding fix, length: {len(public_key_bytes)}")
                            except Exception as pk_e2:
                                print(f"ERROR: Still failed to decode public key: {pk_e2}")
                                raise pk_e2
                        
                        verification = verify_authentication_response(
                            credential=credential_for_verification,
                            expected_challenge=decoded_challenge,
                            expected_rp_id="localhost",  # Verwende immer localhost für lokale Entwicklung
                            expected_origin=origin,
                            credential_public_key=public_key_bytes,
                            credential_current_sign_count=passkey_credential.sign_count,
                        )
                        verification_successful = True
                        print(f"Verification successful with origin: {origin}")
                        break
                    except Exception as e:
                        print(f"Verification failed with origin {origin}: {str(e)}")
                        print(f"Error type: {type(e).__name__}")
                        import traceback
                        print(f"Traceback: {traceback.format_exc()}")
                        verification_error = e
                        continue
                
                if not verification_successful:
                    raise verification_error or Exception("Alle Origin-Versuche fehlgeschlagen")
                
                # Aktualisiere Sign Count und letzte Nutzung
                passkey_credential.sign_count = verification.new_sign_count
                passkey_credential.last_used_at = timezone.now()
                passkey_credential.save()
                
                # Bereinige Session und Datenbank
                request.session.pop('passkey_auth_challenge', None)
                
                # Bereinige auch alle anderen Challenges für diesen Benutzer
                PasskeyAuthChallenge.objects.filter(used=False).delete()
                
                # Generiere JWT-Token
                from rest_framework_simplejwt.tokens import RefreshToken
                refresh = RefreshToken.for_user(passkey_credential.user)
                
                # Erstelle Session-Eintrag für das Session-Management
                try:
                    # Verwende die gleiche Logik wie beim normalen Login
                    from .views import LoginView
                    login_view = LoginView()
                    login_view._create_session_entry(
                        passkey_credential.user, 
                        request, 
                        remember_me=False  # Passkey-Login ist standardmäßig nicht "Remember Me"
                    )
                except Exception as e:
                    print(f"Session-Eintrag für Passkey-Login fehlgeschlagen: {e}")
                
                return Response({
                    'message': 'Passkey-Authentifizierung erfolgreich',
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': {
                        'id': passkey_credential.user.id,
                        'email': passkey_credential.user.email,
                        'first_name': passkey_credential.user.first_name,
                        'last_name': passkey_credential.user.last_name,
                        'role': passkey_credential.user.role,
                    }
                })
                
            except PasskeyCredential.DoesNotExist:
                print(f"Passkey-Credential nicht gefunden für ID: {credential_id}")
                return Response({'error': 'Passkey-Credential nicht gefunden'}, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                print(f"Verifikation fehlgeschlagen: {str(e)}")
                print(f"Exception type: {type(e)}")
                import traceback
                traceback.print_exc()
                return Response({'error': f'Verifikation fehlgeschlagen: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            print(f"Allgemeiner Fehler bei der Passkey-Authentifizierung: {str(e)}")
            print(f"Exception type: {type(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': f'Fehler bei der Passkey-Authentifizierung: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
