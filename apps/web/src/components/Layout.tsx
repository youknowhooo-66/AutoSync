import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import api from '../services/api';
import { MdWarning } from 'react-icons/md';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const res = await api.get('/inventory/low-stock');
        setLowStockCount(res.data.length);
      } catch {}
    };
    fetchLowStock();
    const interval = setInterval(fetchLowStock, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        flex: 1,
        marginLeft: '260px',
        padding: '2rem',
        backgroundColor: 'var(--bg-main)',
        minHeight: '100vh',
        overflowY: 'auto'
      }}>
        {lowStockCount > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1.25rem',
            marginBottom: '1.5rem',
            borderRadius: '0.75rem',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#f59e0b',
            fontSize: '0.875rem',
            fontWeight: 500,
            animation: 'fadeIn 0.5s ease-out'
          }}>
            <MdWarning size={20} />
            <span>
              <strong>Atenção:</strong> {lowStockCount} {lowStockCount === 1 ? 'peça está' : 'peças estão'} com estoque abaixo do mínimo.
              <a href="/estoque" style={{ color: '#f59e0b', marginLeft: '0.5rem', textDecoration: 'underline' }}>Ver estoque →</a>
            </span>
          </div>
        )}
        <div className="fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
