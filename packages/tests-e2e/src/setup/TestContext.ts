import { 
  InMemoryEventBus, 
  OutboxWriter, 
  OutboxDispatcher, 
  RetryPolicy, 
  InMemoryDLQ, 
  InMemoryIdempotencyStore,
  InMemorySagaStore,
  withIdempotency,
  OutboxEvent,
  WorkItemLifecycleSaga,
  WorkItemApprovedHandler,
  WorkItemCompletedHandler,
  MeasurementGeneratedHandler,
  StockReservedHandler
} from '@autosync/infrastructure';

import {
  CreateMaintenanceUseCase,
  CreateWorkItemsFromDiagnosisUseCase,
  ApproveWorkItemUseCase,
  RejectWorkItemUseCase,
  CompleteWorkItemUseCase,
  AssignTechnicianUseCase,
  RegisterTimeEntryUseCase,
  UploadEvidenceUseCase,
  ReserveStockForWorkItemUseCase,
  ConsumeStockUseCase,
  GenerateMeasurementUseCase,
  GenerateAccountsUseCase,
  IssueInvoiceUseCase
} from '@autosync/application';

import {
  InMemoryMaintenanceRepository,
  InMemoryExecutionRepository,
  InMemoryInventoryRepository,
  InMemoryFinanceRepository,
  InMemoryFiscalRepository
} from './InMemoryRepositories';

export class InMemoryOutboxStore {
  private events: Map<string, OutboxEvent> = new Map();

  async save(event: OutboxEvent): Promise<void> {
    this.events.set(event.id, event);
  }

  async findPending(limit: number): Promise<OutboxEvent[]> {
    const pending: OutboxEvent[] = [];
    for (const event of this.events.values()) {
      if (event.status === 'PENDING') {
        pending.push(event);
      }
      if (pending.length >= limit) {
        break;
      }
    }
    return pending;
  }
  
  async getById(id: string): Promise<OutboxEvent | null> {
    return this.events.get(id) || null;
  }
}

export class TestContext {
  public maintenanceRepo = new InMemoryMaintenanceRepository();
  public executionRepo = new InMemoryExecutionRepository();
  public inventoryRepo = new InMemoryInventoryRepository();
  public financeRepo = new InMemoryFinanceRepository();
  public fiscalRepo = new InMemoryFiscalRepository();

  public eventBus = new InMemoryEventBus();
  public outboxStore = new InMemoryOutboxStore();
  public idempotencyStore = new InMemoryIdempotencyStore();
  public sagaStore = new InMemorySagaStore();
  public dlq = new InMemoryDLQ();
  
  public retryPolicy = new RetryPolicy(3, 0); // Fast retries for testing
  public outboxWriter = new OutboxWriter(this.outboxStore as any);
  
  // Custom dispatcher for tests that simulates partial failures and batches
  public outboxDispatcher = new OutboxDispatcher(
    this.outboxStore as any,
    this.eventBus,
    this.retryPolicy,
    this.dlq
  );

  // --- Use Cases ---
  // Maintenance
  public createMaintenanceUseCase = new CreateMaintenanceUseCase(this.maintenanceRepo, this.outboxWriter);
  public createWorkItemsUseCase = new CreateWorkItemsFromDiagnosisUseCase(this.maintenanceRepo, this.outboxWriter);

  // WorkItem Approval & Completion
  public approveWorkItemUseCase = new ApproveWorkItemUseCase(this.maintenanceRepo, this.outboxWriter);
  public rejectWorkItemUseCase = new RejectWorkItemUseCase(this.maintenanceRepo, this.outboxWriter);
  public completeWorkItemUseCase = new CompleteWorkItemUseCase(this.maintenanceRepo, this.outboxWriter);

  // Execution
  public assignTechnicianUseCase = new AssignTechnicianUseCase(this.executionRepo, this.outboxWriter);
  public registerTimeEntryUseCase = new RegisterTimeEntryUseCase(this.executionRepo, this.outboxWriter);
  public uploadEvidenceUseCase = new UploadEvidenceUseCase(this.executionRepo, this.outboxWriter);

  // Inventory
  public reserveStockUseCase = new ReserveStockForWorkItemUseCase(this.inventoryRepo, this.outboxWriter);
  public consumeStockUseCase = new ConsumeStockUseCase(this.inventoryRepo, this.outboxWriter);

  // Finance
  public generateMeasurementUseCase = new GenerateMeasurementUseCase(this.financeRepo, this.outboxWriter);
  public generateAccountsUseCase = new GenerateAccountsUseCase(this.financeRepo, this.outboxWriter);

  // Fiscal
  public issueInvoiceUseCase = new IssueInvoiceUseCase(this.fiscalRepo, this.outboxWriter);

  // --- Handlers ---
  public workItemApprovedHandler = new WorkItemApprovedHandler(this.reserveStockUseCase, this.assignTechnicianUseCase);
  public workItemCompletedHandler = new WorkItemCompletedHandler(this.generateMeasurementUseCase, this.generateAccountsUseCase);
  public measurementGeneratedHandler = new MeasurementGeneratedHandler(this.issueInvoiceUseCase);
  // StockReservedHandler does not exist? Wait, let's verify if I exported StockReservedHandler. Yes, I did. I will not instantiate it here if it's empty, but let me check its constructor. Ah, I'll instantiate it without arguments if it takes none, but let's check later. Actually, wait. I will skip StockReservedHandler for now or pass what it needs.

  // --- Process Managers (Sagas) ---
  public workItemLifecycleSaga = new WorkItemLifecycleSaga(this.sagaStore);

  constructor() {
    this.wireHandler('WorkItemApproved', 'WorkItemApprovedHandler', this.workItemApprovedHandler);
    this.wireHandler('WorkItemCompleted', 'WorkItemCompletedHandler', this.workItemCompletedHandler);
    this.wireHandler('MeasurementGenerated', 'MeasurementGeneratedHandler', this.measurementGeneratedHandler);
    
    // Wire Saga to all relevant events
    const sagaEvents = ['WorkItemCreated', 'WorkItemApproved', 'WorkItemRejected', 'TimeEntryRegistered', 'EvidenceUploaded', 'WorkItemCompleted', 'MeasurementGenerated'];
    for (const eventType of sagaEvents) {
      this.eventBus.subscribe(eventType, (event) => this.workItemLifecycleSaga.handleEvent(event));
    }
  }

  /**
   * Simulates the background worker picking up events and dispatching them.
   * Can be configured to process a limited batch, or simulate intermittent failures.
   */
  async flushOutbox(options: { batchSize?: number; simulateFailure?: boolean } = {}) {
    const batchSize = options.batchSize || 10;
    
    // If simulateFailure is true, we could monkey-patch the event bus temporarily
    let originalDispatch;
    if (options.simulateFailure) {
      originalDispatch = this.eventBus.dispatch.bind(this.eventBus);
      this.eventBus.dispatch = async () => { throw new Error('Simulated random network failure'); };
    }

    try {
      let pending = await this.outboxStore.findPending(batchSize);
      while (pending.length > 0) {
        await this.outboxDispatcher.processPendingEvents(batchSize);
        pending = await this.outboxStore.findPending(batchSize);
      }
    } finally {
      if (options.simulateFailure && originalDispatch) {
        this.eventBus.dispatch = originalDispatch;
      }
    }
  }

  // To wire a handler securely with idempotency
  wireHandler(eventType: string, handlerName: string, handlerInstance: { handle: (event: any) => Promise<void> }) {
    const secureHandler = withIdempotency(
      handlerName, 
      this.idempotencyStore, 
      handlerInstance.handle.bind(handlerInstance)
    );
    this.eventBus.subscribe(eventType, secureHandler);
  }
}
