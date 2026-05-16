import { useAuthStore } from '@/modules/auth/state/auth.store';

export type FeatureFlag = 
  | 'finance.advancedView'
  | 'stock.bulkActions'
  | 'os.autoInvoiceGeneration'
  | 'dashboard.executiveView';

const TENANT_FLAGS: Record<string, FeatureFlag[]> = {
  // 'tn_apple' is an ENTERPRISE tenant from our mock login
  'tn_apple': ['finance.advancedView', 'stock.bulkActions', 'os.autoInvoiceGeneration', 'dashboard.executiveView'],
  'tn_basic': ['dashboard.executiveView']
};

export function useFeatureFlag(flag: FeatureFlag): boolean {
  const user = useAuthStore(state => state.user);
  if (!user || !user.tenantId) return false;

  const tenantFlags = TENANT_FLAGS[user.tenantId] || [];
  return tenantFlags.includes(flag);
}
