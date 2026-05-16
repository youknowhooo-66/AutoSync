import { eventBus } from '../events/eventBus';
import type { DomainEvent, EventType } from '../events/eventTypes';
import { mapEventToMetrics } from './eventToMetrics';
import { useMetricsStore } from './metricsStore';
import { calculateKPIs } from './kpiCalculator';

class MetricsEngine {
  start() {
    // Subscribe to all relevant events for metrics
    const eventsToTrack: EventType[] = [
      'os.created', 'os.completed', 'os.status_changed',
      'invoice.created', 'invoice.paid', 'payment.received',
      'stock.movement.created'
    ];

    eventsToTrack.forEach(eventType => {
      eventBus.subscribe(eventType, (event: DomainEvent) => {
        // Run aggregation asynchronously
        Promise.resolve().then(() => mapEventToMetrics(event));
      });
    });

    console.log('[Metrics Engine] Started and listening to Domain Events.');
  }

  // Exposed method for Dashboard UI to fetch metrics and KPIs
  getTenantDashboardData(tenantId: string) {
    const rawMetrics = useMetricsStore.getState().metricsByTenant[tenantId];
    if (!rawMetrics) {
      return null;
    }
    
    const kpis = calculateKPIs(rawMetrics);
    
    return {
      raw: rawMetrics,
      kpis
    };
  }
}

export const metricsEngine = new MetricsEngine();
