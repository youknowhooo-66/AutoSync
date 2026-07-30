import { DomainEvent } from '@autosync/domain';

export type SagaState = 'PENDING_APPROVAL' | 'APPROVED' | 'EXECUTION_STARTED' | 'COMPLETED' | 'BILLED' | 'REJECTED';

export interface ISagaStore {
  getState(workItemId: string): Promise<SagaState | null>;
  saveState(workItemId: string, state: SagaState): Promise<void>;
}

export class InMemorySagaStore implements ISagaStore {
  private store = new Map<string, SagaState>();

  async getState(workItemId: string): Promise<SagaState | null> {
    return this.store.get(workItemId) || null;
  }

  async saveState(workItemId: string, state: SagaState): Promise<void> {
    this.store.set(workItemId, state);
  }
}

/**
 * WorkItemLifecycleSaga
 * Acts as a Process Manager tracking the end-to-end flow of a WorkItem.
 */
export class WorkItemLifecycleSaga {
  constructor(
    private readonly sagaStore: ISagaStore,
  ) {}

  async handleEvent(event: DomainEvent<any>): Promise<void> {
    const { eventType, payload } = event;

    // Based on the event type, we update the global saga state
    // and potentially trigger compensating actions if something stalls.

    switch (eventType) {
      case 'WorkItemCreated':
        await this.sagaStore.saveState(payload.workItemId, 'PENDING_APPROVAL');
        break;

      case 'WorkItemApproved':
        await this.sagaStore.saveState(payload.workItemId, 'APPROVED');
        console.log(`[SAGA] WorkItem ${payload.workItemId} moved to APPROVED`);
        break;

      case 'WorkItemRejected':
        await this.sagaStore.saveState(payload.workItemId, 'REJECTED');
        console.log(`[SAGA] WorkItem ${payload.workItemId} moved to REJECTED`);
        break;

      // Note: We would have an ExecutionStarted event in a real complete mapping
      // If we see TimeEntryRegistered, it means execution is definitely active
      case 'TimeEntryRegistered':
      case 'EvidenceUploaded':
        const currentState = await this.sagaStore.getState(payload.workItemId);
        if (currentState !== 'EXECUTION_STARTED' && currentState !== 'COMPLETED') {
          await this.sagaStore.saveState(payload.workItemId, 'EXECUTION_STARTED');
          console.log(`[SAGA] WorkItem ${payload.workItemId} moved to EXECUTION_STARTED`);
        }
        break;

      case 'WorkItemCompleted':
        await this.sagaStore.saveState(payload.workItemId, 'COMPLETED');
        console.log(`[SAGA] WorkItem ${payload.workItemId} moved to COMPLETED`);
        break;

      case 'MeasurementGenerated':
        // The measurement groups work items. In a robust saga, the measurement event 
        // would contain the list of workItemIds. We assume it does here for demonstration.
        if (payload.workItemIds) {
          for (const wi of payload.workItemIds) {
            await this.sagaStore.saveState(wi, 'BILLED');
            console.log(`[SAGA] WorkItem ${wi} moved to BILLED`);
          }
        }
        break;
    }
  }
}
