import React from 'react';
import { ThemeProvider } from 'next-themes';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import Login from './modules/auth/pages/Login';
import Unauthorized from './modules/auth/pages/Unauthorized';
import ExecutiveDashboard from './modules/dashboard/pages/ExecutiveDashboard';
import Clients from './modules/clients/pages/ClientList';
import Inventory from './modules/inventory/pages/Inventory';
import ServiceOrders from './modules/service-orders/pages/ServiceOrders';
import Vehicles from './pages/Vehicles';
import Financial from './modules/finance/invoices/pages/Invoices';
import Branches from './pages/Branches';
import Suppliers from './pages/Suppliers';
import Users from './pages/Users';
import Audit from './pages/Audit';
import Reports from './pages/Reports';

import { useAuth } from './modules/auth/hooks/useAuth';
import { ProtectedRoute } from './modules/auth/components/ProtectedRoute';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route path="/" element={<ProtectedRoute><AppLayout><ExecutiveDashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/os" element={<ProtectedRoute><AppLayout><ServiceOrders /></AppLayout></ProtectedRoute>} />
      <Route path="/estoque" element={<ProtectedRoute><AppLayout><Inventory /></AppLayout></ProtectedRoute>} />
      <Route path="/clientes" element={<ProtectedRoute><AppLayout><Clients /></AppLayout></ProtectedRoute>} />
      <Route path="/veiculos" element={<ProtectedRoute><AppLayout><Vehicles /></AppLayout></ProtectedRoute>} />
      <Route path="/fornecedores" element={<ProtectedRoute><AppLayout><Suppliers /></AppLayout></ProtectedRoute>} />
      <Route path="/financeiro" element={<ProtectedRoute><AppLayout><Financial /></AppLayout></ProtectedRoute>} />
      <Route path="/filiais" element={<ProtectedRoute><AppLayout><Branches /></AppLayout></ProtectedRoute>} />
      <Route path="/usuarios" element={<ProtectedRoute><AppLayout><Users /></AppLayout></ProtectedRoute>} />
      <Route path="/auditoria" element={<ProtectedRoute><AppLayout><Audit /></AppLayout></ProtectedRoute>} />
      <Route path="/relatorios" element={<ProtectedRoute><AppLayout><Reports /></AppLayout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
