import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AuthGuard } from '../components/AuthGuard';

// Pages (Lazy loading)
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const Clients = React.lazy(() => import('../pages/Clients'));
const Login = React.lazy(() => import('../pages/Login'));

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <AuthGuard>
            <DashboardLayout />
          </AuthGuard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        {/* Add more routes here */}
      </Route>
    </Routes>
  );
}
