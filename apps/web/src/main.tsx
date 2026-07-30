import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { setupAuditMiddleware } from './core/audit/audit.middleware'
import { setupDomainSubscriptions } from './core/events/subscriptions'
import { metricsEngine } from './core/metrics/metricsEngine'

import { GlobalErrorBoundary } from './core/resilience/errorBoundary/GlobalErrorBoundary'
import { setupQueryMonitor } from './core/resilience/observability/queryMonitor'

// Initialize Event-Driven Architecture Core
setupAuditMiddleware()
setupDomainSubscriptions()
metricsEngine.start()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

// Initialize Observability
setupQueryMonitor(queryClient)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </GlobalErrorBoundary>
  </StrictMode>,
)
