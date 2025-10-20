import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/Toaster';
import { AuthProvider } from './contexts/AuthContext';
import { EnhancedErrorBoundary } from './components/errors/EnhancedErrorBoundary';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';
import { AdministrativeSettingsPage } from './pages/AdministrativeSettingsPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { ComponentShowcasePage } from './pages/ComponentShowcasePage';
import { TemplatePage, ExamplePage, ProductionPage } from './pages/TemplatePage';

// Route-Konfiguration für DRY-Prinzip
const routes = [
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/profile/settings', element: <ProfileSettingsPage /> },
  { path: '/profile', element: <ProfileSettingsPage /> },
  { path: '/forbidden', element: <ForbiddenPage /> },
  { path: '/admin/settings', element: <AdministrativeSettingsPage /> },
  { path: '/components', element: <ComponentShowcasePage /> },
  { path: '/template', element: <TemplatePage /> },
  { path: '/example', element: <ExamplePage /> },
  { path: '/production', element: <ProductionPage /> },
];

// Wrapper-Komponente für Error Boundary
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <EnhancedErrorBoundary showRetryButton={true}>
    {children}
  </EnhancedErrorBoundary>
);

function App() {
  return (
    <EnhancedErrorBoundary showRetryButton={true}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {routes.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={<RouteWrapper>{route.element}</RouteWrapper>}
                />
              ))}
            </Routes>
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </EnhancedErrorBoundary>
  );
}

export default App;