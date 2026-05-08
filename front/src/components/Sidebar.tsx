import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  MdDashboard,
  MdBuild,
  MdInventory,
  MdPeople,
  MdDirectionsCar,
  MdAttachMoney,
  MdStore,
  MdLocalShipping,
  MdAdminPanelSettings,
  MdLogout,
  MdHistory,
  MdBarChart
} from 'react-icons/md';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <MdDashboard size={22} /> },
    { name: 'Ordens de Serviço', path: '/os', icon: <MdBuild size={22} /> },
    { name: 'Estoque', path: '/estoque', icon: <MdInventory size={22} /> },
    { name: 'Clientes', path: '/clientes', icon: <MdPeople size={22} /> },
    { name: 'Veículos', path: '/veiculos', icon: <MdDirectionsCar size={22} /> },
    { name: 'Fornecedores', path: '/fornecedores', icon: <MdLocalShipping size={22} /> },
    { name: 'Financeiro', path: '/financeiro', icon: <MdAttachMoney size={22} /> },
    { name: 'Filiais', path: '/filiais', icon: <MdStore size={22} /> },
    { name: 'Usuários', path: '/usuarios', icon: <MdAdminPanelSettings size={22} /> },
    { name: 'Auditoria', path: '/auditoria', icon: <MdHistory size={22} /> },
    { name: 'Relatórios', path: '/relatorios', icon: <MdBarChart size={22} /> },
  ];

  return (
    <div className="sidebar" style={{
      width: '260px',
      height: '100vh',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100
    }}>
      <div className="logo" style={{
        padding: '2rem',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textAlign: 'center'
      }}>
        AutoSync ERP
      </div>

      <nav style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              textDecoration: 'none',
              borderRadius: '8px',
              marginBottom: '4px',
              backgroundColor: isActive ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
              transition: 'all 0.3s ease',
              fontWeight: isActive ? '600' : '400',
              fontSize: '0.9rem'
            })}
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* User Info + Logout */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
        {user && (
          <div style={{ padding: '0 16px', marginBottom: '0.75rem' }}>
            <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user.name}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            color: 'var(--danger)',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'background 0.3s',
            fontSize: '0.9rem'
          }}
        >
          <MdLogout size={22} />
          Sair
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
