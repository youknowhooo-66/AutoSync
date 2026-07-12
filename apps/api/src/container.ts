import { createIdentityAdapter } from './adapters/IdentityCompatibilityAdapter';
import { createFleetAdapter } from './adapters/FleetCompatibilityAdapter';
import { createFinanceAdapter } from './adapters/FinanceCompatibilityAdapter';

const identityAdapter = createIdentityAdapter();
const fleetAdapter = createFleetAdapter();
const financeAdapter = createFinanceAdapter();

export const container = {
  useCases: {
    identity: identityAdapter,
    fleet: fleetAdapter,
    financial: financeAdapter
  },
  queries: {
    finance: financeAdapter
  }
};
