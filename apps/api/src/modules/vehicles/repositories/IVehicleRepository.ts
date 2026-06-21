// apps/api/src/modules/vehicles/repositories/IVehicleRepository.ts

import { CreateVehicleDTO, UpdateVehicleDTO } from '../dtos';
import { Vehicle } from "@prisma/client";

export interface IVehicleRepository {
  create(data: CreateVehicleDTO): Promise<Vehicle>;
  findById(id: string, companyId: string): Promise<Vehicle | null>;
  findByPlate(plate: string, companyId: string): Promise<Vehicle | null>;
  findManyByCompany(companyId: string): Promise<Vehicle[]>;
  findManyByClient(clientId: string, companyId: string): Promise<Vehicle[]>;
  update(data: UpdateVehicleDTO): Promise<Vehicle>;
  delete(id: string, companyId: string): Promise<void>;
}

export type { Vehicle };
