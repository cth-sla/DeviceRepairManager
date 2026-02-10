import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/Dashboard';
import { RepairsPage } from './pages/Repairs';
import { CustomersPage } from './pages/Customers';
import { OrganizationsPage } from './pages/Organizations';
import { WarrantyPage } from './pages/Warranty';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/organizations" element={<OrganizationsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/repairs" element={<RepairsPage />} />
          <Route path="/warranty" element={<WarrantyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;