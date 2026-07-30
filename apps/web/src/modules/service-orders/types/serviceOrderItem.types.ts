export type ItemType = 'PART' | 'SERVICE';

export interface ServiceOrderPart {
  id: string;
  serviceOrderId: string;
  partId: string;
  quantity: number;
  unitPrice: string;
  part?: {
    id: string;
    name: string;
    internalCode?: string;
  };
}

export interface ServiceOrderService {
  id: string;
  serviceOrderId: string;
  name: string;
  price: string;
}

export interface AddServiceOrderItemPayload {
  serviceOrderId: string;
  parts?: Array<{
    stockId: string;
    quantity: number;
    unitPrice?: string;
  }>;
  services?: Array<{
    description: string;
    quantity: number;
    unitPrice: string;
  }>;
}

export interface RemoveServiceOrderItemPayload {
  serviceOrderId: string;
  itemId: string;
  type: ItemType;
}
