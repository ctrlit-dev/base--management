import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LoginForm } from '../components/LoginForm';
import { authApi } from '../api/auth';
import { LoginFormData } from '../components/LoginForm';

export function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (formData: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login({
        email: formData.email,
        password: formData.password,
        remember_me: formData.remember_me,
      });

      // Prüfe auf API-Fehler
      if (response.error) {
        setError(response.error);
        toast.error('Anmeldung fehlgeschlagen');
        return;
      }

      // Prüfe auf gültige Daten
      if (!response.data) {
        setError('Keine Benutzerdaten erhalten');
        toast.error('Anmeldung fehlgeschlagen');
        return;
      }

      // Speichere Tokens und Benutzerdaten
      localStorage.setItem('lcree_access', response.data.access);
      localStorage.setItem('lcree_refresh', response.data.refresh);
      localStorage.setItem('lcree_user', JSON.stringify(response.data.user));

      // Erfolgreiche Anmeldung
      toast.success(`Willkommen zurück, ${response.data.user.first_name}!`);
      
      // Navigiere zum Dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Behandle verschiedene Fehlertypen
      if (err.response?.status === 401) {
        setError('Ungültige E-Mail-Adresse oder Passwort.');
      } else if (err.response?.status === 400) {
        setError('Bitte überprüfen Sie Ihre Eingaben.');
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      }
      
      toast.error('Anmeldung fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginForm 
      onSubmit={handleLogin}
      isLoading={isLoading}
      error={error}
    />
  );
}