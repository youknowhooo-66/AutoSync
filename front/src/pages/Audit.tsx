import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MdHistory, MdSearch, MdInfo } from 'react-icons/md';
import Modal from '../components/Modal';
import api from '../services/api';

interface AuditLog {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  ip?: string;
  createdAt: string;
}

const Audit: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/audit');
      setLogs(response.data);
    } catch (error) {
      toast.error('Erro ao buscar logs de auditoria.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  const filteredLogs = logs.filter(log =>
    log.user.name.toLowerCase().includes(search.toLowerCase()) ||
    log.resource.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase())
  );

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return '#10b981';
      case 'UPDATE': return '#f59e0b';
      case 'DELETE': return '#ef4444';
      case 'LOGIN': return '#3b82f6';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Auditoria</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Histórico completo de ações e alterações no sistema.</p>
        </div>
      </header>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <MdSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Pesquisar por usuário, recurso ou ação..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '40px' }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Data/Hora</th>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Usuário</th>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Ação</th>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Recurso</th>
              <th style={{ textAlign: 'right', padding: '1rem' }}>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Nenhum log encontrado.</td></tr>
            ) : filteredLogs.map((log) => (
              <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {new Date(log.createdAt).toLocaleString('pt-BR')}
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 600 }}>{log.user.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{log.user.email}</div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: `${getActionColor(log.action)}20`,
                    color: getActionColor(log.action)
                  }}>
                    {log.action}
                  </span>
                </td>
                <td style={{ padding: '1rem', fontWeight: 500 }}>{log.resource}</td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button
                    onClick={() => handleViewDetails(log)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}
                  >
                    <MdInfo size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Detalhes do Log" width="600px">
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Usuário</label>
                <p style={{ fontWeight: 600 }}>{selectedLog.user.name}</p>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Data/Hora</label>
                <p style={{ fontWeight: 600 }}>{new Date(selectedLog.createdAt).toLocaleString('pt-BR')}</p>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ação</label>
                <p style={{ fontWeight: 600, color: getActionColor(selectedLog.action) }}>{selectedLog.action}</p>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recurso</label>
                <p style={{ fontWeight: 600 }}>{selectedLog.resource} ({selectedLog.resourceId || 'N/A'})</p>
              </div>
              {selectedLog.ip && (
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>IP</label>
                  <p style={{ fontWeight: 600 }}>{selectedLog.ip}</p>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Alterações</label>
              <div style={{
                marginTop: '0.5rem',
                padding: '1rem',
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: '8px',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                <pre style={{ fontSize: '0.8rem', margin: 0 }}>
                  {JSON.stringify({
                    antigo: selectedLog.oldValue,
                    novo: selectedLog.newValue
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Audit;
