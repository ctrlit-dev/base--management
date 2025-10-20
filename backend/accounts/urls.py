"""
LCREE Accounts URLs
===================

URL-Konfiguration für die Accounts-App.

Endpunkte:
- /api/v1/accounts/users/ - Benutzerverwaltung
- /api/v1/accounts/passkeys/ - Passkey-Verwaltung
- /api/v1/accounts/profiles/ - Profilverwaltung
- /api/v1/accounts/auth/ - Authentifizierung
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import passkey_views

# Router für ViewSets
router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'passkeys', views.PasskeyCredentialViewSet)
router.register(r'profiles', views.UserProfileViewSet)

urlpatterns = [
    # ViewSet-basierte URLs
    path('', include(router.urls)),

    # Authentifizierung
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/token/refresh/', views.TokenRefreshView.as_view(), name='token-refresh'),

    # Passwort-Reset
    path('auth/password-reset/', views.PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('auth/password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('auth/change-password/', views.ChangePasswordView.as_view(), name='change-password'),

    # Session-Management
    path('auth/sessions/', views.SessionManagementView.as_view(), name='session-management'),
    path('auth/logout-all/', views.LogoutAllSessionsView.as_view(), name='logout-all-sessions'),

    # E-Mail-Verifizierung
    path('auth/verify-email/', views.EmailVerificationView.as_view(), name='email-verification'),
    path('auth/resend-verification/', views.ResendVerificationEmailView.as_view(), name='resend-verification'),

    # Passkeys - Registrierung
    path('auth/passkey/register/options/', passkey_views.PasskeyRegisterOptionsView.as_view(), name='passkey-register-options'),
    path('auth/passkey/register/verify/', passkey_views.PasskeyRegisterVerifyView.as_view(), name='passkey-register-verify'),
    
    # Passkeys - Authentifizierung
    path('auth/passkey/authenticate/options/', passkey_views.PasskeyAuthenticateOptionsView.as_view(), name='passkey-authenticate-options'),
    path('auth/passkey/authenticate/verify/', passkey_views.PasskeyAuthenticateVerifyView.as_view(), name='passkey-authenticate-verify'),
    
    # Passkeys - Management
    path('auth/passkey/manage/', views.PasskeyManagementView.as_view(), name='passkey-management'),

    # Test-Route
    path('test/', views.TestView.as_view(), name='test'),
    
    # Avatar-Upload
    path('avatar/upload/', views.AvatarUploadView.as_view(), name='upload-avatar'),
]
