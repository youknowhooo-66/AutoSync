import { UpdateClientService } from '../modules/clients/services/UpdateClientService';
import { CreateVehicleService } from '../modules/vehicles/services/CreateVehicleService';
import { UpdateVehicleService } from '../modules/vehicles/services/UpdateVehicleService';
import { PrismaClientRepository } from '../modules/clients/repositories/PrismaClientRepository';
import { PrismaVehicleRepository } from '../modules/vehicles/repositories/PrismaVehicleRepository';

export class FleetCompatibilityAdapter {
  constructor(
    private updateClientService: UpdateClientService,
    private registerVehicleService: CreateVehicleService,
    private updateVehicleService: UpdateVehicleService
  ) {}

  updateClient = {
    execute: async (payload: any) => {
      return this.updateClientService.execute({
        id: payload.clientId,
        ...payload
      });
    }
  };

  registerVehicle = {
    execute: async (payload: any) => {
      return this.registerVehicleService.execute({
        year: payload.year || new Date().getFullYear(),
        brand: payload.brand || 'N/A',
        model: payload.model || 'N/A',
        ...payload
      });
    }
  };

  updateVehicle = {
    execute: async (payload: any) => {
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
