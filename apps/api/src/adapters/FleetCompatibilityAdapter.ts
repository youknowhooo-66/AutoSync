import { UpdateClientService } from '../modules/clients/services/UpdateClientService';
import { CreateVehicleService } from '../modules/vehicles/services/CreateVehicleService';
import { UpdateVehicleService } from '../modules/vehicles/services/UpdateVehicleService';
import { PrismaClientRepository } from '../modules/clients/repositories/PrismaClientRepository';
import { PrismaVehicleRepository } from '../modules/vehicles/repositories/PrismaVehicleRepository';

export interface UpdateClientInput {
  clientId: string;
  companyId: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface RegisterVehicleInput {
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

export interface UpdateVehicleInput {
  vehicleId: string;
  companyId: string;
  clientId?: string;
  plate?: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  chassis?: string;
  mileage?: number;
  engine?: string;
}

export class FleetCompatibilityAdapter {
  constructor(
    private updateClientService: UpdateClientService,
    private registerVehicleService: CreateVehicleService,
    private updateVehicleService: UpdateVehicleService
  ) {}

  updateClient = {
    execute: async (payload: UpdateClientInput) => {
      return this.updateClientService.execute({
        id: payload.clientId,
        ...payload
      });
    }
  };

  registerVehicle = {
    execute: async (payload: RegisterVehicleInput) => {
      return this.registerVehicleService.execute(payload);
    }
  };

  updateVehicle = {
    execute: async (payload: UpdateVehicleInput) => {
      return this.updateVehicleService.execute({
        id: payload.vehicleId,
        ...payload
      });
    }
  };
}

export const createFleetAdapter = () => {
  const clientRepo = new PrismaClientRepository();
  const vehicleRepo = new PrismaVehicleRepository();
  return new FleetCompatibilityAdapter(
    new UpdateClientService(clientRepo),
    new CreateVehicleService(vehicleRepo),
    new UpdateVehicleService(vehicleRepo)
  );
};
