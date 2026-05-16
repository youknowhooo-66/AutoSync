import api from '@/services/api';
import type { AuditLogEntry } from './audit.types';
import { useAuditStore } from './audit.store';

class AuditService {
  persist(log: AuditLogEntry) {
    // 1. Add to local state (for real-time UI)
    useAuditStore.getState().addLog(log);
    
    // 2. Logging for debug
    console.log('[AUDIT LOG]:', log);
  }

  async fetchLogs(filters?: any): Promise<AuditLogEntry[]> {
    try {
      const response = await api.get('/audit', { params: filters });
      const logs = response.data;
      
      // Merge with local logs if needed, but for historical view we just set the store
      useAuditStore.getState().setLogs(logs);
      
      return logs;
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      return [];
    }
  }
}

export const auditService = new AuditService();
