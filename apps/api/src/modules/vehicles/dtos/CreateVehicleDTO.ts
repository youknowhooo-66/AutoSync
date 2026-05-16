// apps/api/src/modules/vehicles/dtos/CreateVehicleDTO.ts

export interface CreateVehicleDTO {
  companyId: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
  clientId: string;
}
