export type ServiceOrderStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';

export interface ServiceOrderPart {
  id: string;
  partId: string;
  partName: string;
  quantity: number;
  unitPrice: number;
}

export interface ServiceOrderService {
  id: string;
  name: string;
  price: number;
}

export interface ServiceOrder {
  id: string;
  number: number;
  status: ServiceOrderStatus;
  clientId: string;
  vehicleId: string;
  branchId: string;
  mechanicId?: string;
  notes?: string;
  totalParts: number;
  totalServices: number;
  finalValue: number;
  client: {
    name: string;
    email: string;
  };
  vehicle: {
    plate: string;
    model: string;
  };
  parts: ServiceOrderPart[];
  services: ServiceOrderService[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceOrderDTO {
  clientId: string;
  vehicleId: string;
  branchId: string;
  mechanicId?: string;
  notes?: string;
  parts: Array<{
    partId: string;
    quantity: number;
    unitPrice: number;
  }>;
  services: Array<{
    name: string;
    price: number;
  }>;
}

export interface ServiceOrderListResponse {
  success: true;
  data: ServiceOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
