import { create } from 'zustand';
import type { AuditLogEntry } from './audit.types';

interface AuditState {
  logs: AuditLogEntry[];
  loading: boolean;
  addLog: (log: AuditLogEntry) => void;
  setLogs: (logs: AuditLogEntry[]) => void;
  clearLogs: () => void;
}

export const useAuditStore = create<AuditState>((set) => ({
  logs: [],
  loading: false,
  
  addLog: (log) => set((state) => ({ logs: [log, ...state.logs].slice(0, 1000) })), // Keep last 1000 in memory
  setLogs: (logs) => set({ logs }),
  clearLogs: () => set({ logs: [] })
}));
