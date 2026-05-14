// apps/api/src/modules/vehicles/repositories/IVehicleRepository.ts

import { CreateVehicleDTO, UpdateVehicleDTO } from '../dtos';

export interface Vehicle {
  id: string;
  companyId: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVehicleRepository {
  create(data: CreateVehicleDTO): Promise<Vehicle>;
  findById(id: string, companyId: string): Promise<Vehicle | null>;
  findByLicensePlate(licensePlate: string, companyId: string): Promise<Vehicle | null>;
  findManyByCompany(companyId: string): Promise<Vehicle[]>;
  findManyByClient(clientId: string, companyId: string): Promise<Vehicle[]>;
  update(data: UpdateVehicleDTO): Promise<Vehicle>;
  delete(id: string, companyId: string): Promise<void>;
}
