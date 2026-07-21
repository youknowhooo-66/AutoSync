import React, { lazy, Suspense } from 'react';
import { ThemeProvider } from 'next-themes';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { PageSkeleton } from './components/feedback/PageSkeleton';
import { useAuth } from './modules/auth/hooks/useAuth';
import { ProtectedRoute } from './modules/auth/components/ProtectedRoute';

// Lazy-loaded route components for performance optimization and code splitting
const Login = lazy(() => import('./modules/auth/pages/Login'));
const Unauthorized = lazy(() => import('./modules/auth/pages/Unauthorized'));
const ExecutiveDashboard = lazy(() => import('./modules/dashboard/pages/ExecutiveDashboard'));
const ServiceOrders = lazy(() => import('./modules/service-orders/pages/ServiceOrders'));
const Inventory = lazy(() => import('./modules/inventory/pages/Inventory'));
const Clients = lazy(() => import('./modules/clients/pages/ClientList'));
const Vehicles = lazy(() => import('./modules/vehicles/pages/VehicleList'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Financial = lazy(() => import('./pages/Financial'));
const Branches = lazy(() => import('./pages/Branches'));
const Users = lazy(() => import('./pages/Users'));
const Audit = lazy(() => import('./pages/Audit'));
const Reports = lazy(() => import('./pages/Reports'));

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ExecutiveDashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/os"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ServiceOrders />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/estoque"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Inventory />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clientes"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Clients />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/veiculos"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Vehicles />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fornecedores"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Suppliers />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/financeiro"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Financial />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/filiais"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Branches />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Users />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/auditoria"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Audit />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/relatorios"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Reports />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
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
