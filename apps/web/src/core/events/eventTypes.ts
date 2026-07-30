export type EventPayload = {
  tenantId: string;
  userId: string;
  roleContext: string;
  timestamp: string;
  data: Record<string, any>;
};

export type EventType =
  // Service Orders
  | 'os.created'
  | 'os.updated'
  | 'os.status_changed'
  | 'os.completed'
  // Inventory
  | 'stock.adjusted'
  | 'stock.movement.created'
  | 'stock.reserved'
  | 'stock.released'
  // Finance
  | 'invoice.created'
  | 'invoice.issued'
  | 'invoice.paid'
  | 'payment.received';

export interface DomainEvent {
  id: string;
  type: EventType;
  payload: EventPayload;
}
