import { 
  IMaintenanceRepository, 
  IExecutionRepository, 
  IInventoryRepository, 
  IFinanceRepository, 
  IFiscalRepository 
} from '@autosync/application';

import { 
  Maintenance, 
  TechnicalAssignment, 
  Evidence, 
  StockItem, 
  Measurement, 
  AccountPayable, 
  AccountReceivable, 
  Invoice, 
  ServiceInvoice,
  TechnicalTimeEntry
} from '@autosync/domain';

export class InMemoryMaintenanceRepository implements IMaintenanceRepository {
  private data = new Map<string, Maintenance>();

  async findById(id: string): Promise<Maintenance | null> {
    return this.data.get(id) || null;
  }

  async save(maintenance: Maintenance): Promise<void> {
    this.data.set(maintenance.id.value, maintenance);
  }
}

export class InMemoryExecutionRepository implements IExecutionRepository {
  private assignments = new Map<string, TechnicalAssignment>();
  private timeEntries = new Map<string, any>();
  private evidences = new Map<string, Evidence>();

  async findAssignmentById(id: string): Promise<TechnicalAssignment | null> {
    return this.assignments.get(id) || null;
  }

  async saveAssignment(assignment: TechnicalAssignment): Promise<void> {
    this.assignments.set(assignment.id.value, assignment);
  }

  getAssignments() { return Array.from(this.assignments.values()); }

  async saveTimeEntry(timeEntry: any): Promise<void> {
    this.timeEntries.set(timeEntry.id.value, timeEntry);
  }

  async saveEvidence(evidence: Evidence): Promise<void> {
    this.evidences.set(evidence.id.value, evidence);
  }
}

export class InMemoryInventoryRepository implements IInventoryRepository {
  private data = new Map<string, StockItem>();

  async findById(id: string): Promise<StockItem | null> {
    return this.data.get(id) || null;
  }

  async save(stockItem: StockItem): Promise<void> {
    this.data.set(stockItem.id.value, stockItem);
  }
}

export class InMemoryFinanceRepository implements IFinanceRepository {
  private measurements = new Map<string, Measurement>();
  private payables = new Map<string, AccountPayable>();
  private receivables = new Map<string, AccountReceivable>();

  async findById(id: string): Promise<Measurement | null> {
    return this.measurements.get(id) || null;
  }

  async save(measurement: Measurement): Promise<void> {
    this.measurements.set(measurement.id.value, measurement);
  }

  getMeasurements() { return Array.from(this.measurements.values()); }

  async savePayable(payable: AccountPayable): Promise<void> {
    this.payables.set(payable.id.value, payable);
  }

  async saveReceivable(receivable: AccountReceivable): Promise<void> {
    this.receivables.set(receivable.id.value, receivable);
  }

  getReceivables() { return Array.from(this.receivables.values()); }
}

export class InMemoryFiscalRepository implements IFiscalRepository {
  private invoices = new Map<string, Invoice>();
  private serviceInvoices = new Map<string, ServiceInvoice>();

  async saveInvoice(invoice: Invoice): Promise<void> {
    this.invoices.set(invoice.id.value, invoice);
  }

  async saveServiceInvoice(serviceInvoice: ServiceInvoice): Promise<void> {
    this.serviceInvoices.set(serviceInvoice.id.value, serviceInvoice);
  }
  
  getServiceInvoices() { return Array.from(this.serviceInvoices.values()); }
}
