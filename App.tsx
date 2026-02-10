
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/Dashboard';
import { RepairsPage } from './pages/Repairs';
import { CustomersPage } from './pages/Customers';
import { OrganizationsPage } from './pages/Organizations';
import { WarrantyPage } from './pages/Warranty';
import { LoginPage } from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Component to protect routes that require login
// Using React.FC to ensure children property is correctly recognized in JSX usage
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Component to redirect logged-in users away from login page
// Using React.FC to ensure children property is correctly recognized in JSX usage
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  
  if (session) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      
      <Route path="/organizations" element={
        <ProtectedRoute>
          <OrganizationsPage />
        </ProtectedRoute>
      } />
      
      <Route path="/customers" element={
        <ProtectedRoute>
          <CustomersPage />
        </ProtectedRoute>
      } />
      
      <Route path="/repairs" element={
        <ProtectedRoute>
          <RepairsPage />
        </ProtectedRoute>
      } />
      
      <Route path="/warranty" element={
        <ProtectedRoute>
          <WarrantyPage />
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
