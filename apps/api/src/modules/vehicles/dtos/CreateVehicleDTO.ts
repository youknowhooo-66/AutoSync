// apps/api/src/modules/vehicles/dtos/CreateVehicleDTO.ts

export interface CreateVehicleDTO {
  companyId: string;
  clientId: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  chassis?: string;
  mileage?: number;
  engine?: string;
}

