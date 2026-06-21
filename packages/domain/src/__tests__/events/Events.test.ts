import { describe, it, expect } from 'vitest';
import { createMaintenanceCreatedEvent } from '../../maintenance/events/MaintenanceCreated.v1';
import { createWorkItemCreatedEvent } from '../../maintenance/events/WorkItemEvents.v1';

describe('Event Contracts Integrity', () => {
  it('should create an event with all mandatory metadata fields (event-contracts.md)', () => {
    const companyId = 'company-123';
    const correlationId = 'corr-123';
    
    const event = createMaintenanceCreatedEvent(
      {
        maintenanceId: 'maint-123',
        clientId: 'client-123',
        vehicleId: 'veh-123',
      },
      { companyId, correlationId }
    );

    // Mandatory metadata validation
    expect(event).toHaveProperty('eventId');
    expect(typeof event.eventId).toBe('string');
    
    expect(event).toHaveProperty('eventType', 'MaintenanceCreated');
    
    expect(event).toHaveProperty('timestamp');
    expect(event.timestamp).toBeInstanceOf(Date);
    
    expect(event).toHaveProperty('companyId', companyId);
    expect(event).toHaveProperty('correlationId', correlationId);
    expect(event).toHaveProperty('version', 'v1');
    
    // Payload validation
    expect(event.payload).toEqual({
      maintenanceId: 'maint-123',
      clientId: 'client-123',
      vehicleId: 'veh-123',
    });
  });

  it('should generate a different UUID for each event if not provided explicitly', () => {
    const companyId = 'company-123';
    const correlationId = 'corr-123';

    const event1 = createWorkItemCreatedEvent(
      {
        workItemId: 'wi-1',
        maintenanceId: 'maint-1',
        description: 'Test',
        estimatedCost: 100,
      },
      { companyId, correlationId }
    );

    const event2 = createWorkItemCreatedEvent(
      {
        workItemId: 'wi-2',
        maintenanceId: 'maint-1',
        description: 'Test 2',
        estimatedCost: 200,
      },
      { companyId, correlationId }
    );

    expect(event1.eventId).not.toBe(event2.eventId);
  });
});
