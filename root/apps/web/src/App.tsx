import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Inventory from './pages/Inventory';
import ServiceOrders from './pages/ServiceOrders';
import Vehicles from './pages/Vehicles';
import Financial from './pages/Financial';
import Branches from './pages/Branches';
import Suppliers from './pages/Suppliers';
import Users from './pages/Users';
import Audit from './pages/Audit';
import Reports from './pages/Reports';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, loading } = useAuth();

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', color: 'var(--accent)', fontSize: '1.25rem'
    }}>
      Carregando...
    </div>
  );
  if (!token) return <Navigate to="/login" />;

  return <Layout>{children}</Layout>;
};

function AppContent() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />

      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/os" element={<ProtectedRoute><ServiceOrders /></ProtectedRoute>} />
      <Route path="/estoque" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
      <Route path="/clientes" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
      <Route path="/veiculos" element={<ProtectedRoute><Vehicles /></ProtectedRoute>} />
      <Route path="/fornecedores" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
      <Route path="/financeiro" element={<ProtectedRoute><Financial /></ProtectedRoute>} />
      <Route path="/filiais" element={<ProtectedRoute><Branches /></ProtectedRoute>} />
      <Route path="/usuarios" element={<ProtectedRoute><Users /></ProtectedRoute>} />
      <Route path="/auditoria" element={<ProtectedRoute><Audit /></ProtectedRoute>} />
      <Route path="/relatorios" element={<ProtectedRoute><Reports /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
        <ToastContainer position="bottom-right" theme="dark" />
      </Router>
    </AuthProvider>
  );
}

export default App;
