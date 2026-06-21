export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  clientId: string;
  client?: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleDTO {
  plate: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  clientId: string;
}

export interface VehicleListResponse {
  success: true;
  data: Vehicle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
