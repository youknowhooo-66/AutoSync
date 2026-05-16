// apps/api/src/modules/vehicles/dtos/UpdateVehicleDTO.ts

export interface UpdateVehicleDTO {
  id: string;
  companyId: string;
  brand?: string;
  model?: string;
  year?: number;
  licensePlate?: string;
  color?: string;
  clientId?: string;
}
