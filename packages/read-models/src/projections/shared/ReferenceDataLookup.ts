export interface MaintenanceContext {
  maintenanceId: string;
  companyId: string;
  clientId: string;
  vehicleId: string;
}

export interface VehicleReference {
  vehicleId: string;
  plate: string;
}

export interface ClientReference {
  clientId: string;
  name: string;
}

export interface TechnicianReference {
  technicianId: string;
  name: string;
}

export interface WorkItemTechnicianMapping {
  workItemId: string;
  technicianId: string;
}

/**
 * Denormalization lookup — NOT aggregate access.
 * Populated by reference events or test fixtures.
 */
export interface IReferenceDataLookup {
  getMaintenanceContext(maintenanceId: string): MaintenanceContext | null;
  saveMaintenanceContext(context: MaintenanceContext): void;

  getVehicle(vehicleId: string): VehicleReference | null;
  registerVehicle(ref: VehicleReference): void;

  getClient(clientId: string): ClientReference | null;
  registerClient(ref: ClientReference): void;

  getTechnician(technicianId: string): TechnicianReference | null;
  registerTechnician(ref: TechnicianReference): void;

  getTechnicianForWorkItem(workItemId: string): string | null;
  assignTechnicianToWorkItem(mapping: WorkItemTechnicianMapping): void;

  getVehicleForMaintenance(maintenanceId: string): string | null;
  linkMaintenanceToVehicle(maintenanceId: string, vehicleId: string): void;
}

export class InMemoryReferenceDataLookup implements IReferenceDataLookup {
  private maintenanceContexts = new Map<string, MaintenanceContext>();
  private vehicles = new Map<string, VehicleReference>();
  private clients = new Map<string, ClientReference>();
  private technicians = new Map<string, TechnicianReference>();
  private workItemTechnicians = new Map<string, string>();
  private maintenanceVehicles = new Map<string, string>();

  getMaintenanceContext(maintenanceId: string): MaintenanceContext | null {
    return this.maintenanceContexts.get(maintenanceId) ?? null;
  }

  saveMaintenanceContext(context: MaintenanceContext): void {
    this.maintenanceContexts.set(context.maintenanceId, context);
    this.maintenanceVehicles.set(context.maintenanceId, context.vehicleId);
  }

  getVehicle(vehicleId: string): VehicleReference | null {
    return this.vehicles.get(vehicleId) ?? null;
  }

  registerVehicle(ref: VehicleReference): void {
    this.vehicles.set(ref.vehicleId, ref);
  }

  getClient(clientId: string): ClientReference | null {
    return this.clients.get(clientId) ?? null;
  }

  registerClient(ref: ClientReference): void {
    this.clients.set(ref.clientId, ref);
  }

  getTechnician(technicianId: string): TechnicianReference | null {
    return this.technicians.get(technicianId) ?? null;
  }

  registerTechnician(ref: TechnicianReference): void {
    this.technicians.set(ref.technicianId, ref);
  }

  getTechnicianForWorkItem(workItemId: string): string | null {
    return this.workItemTechnicians.get(workItemId) ?? null;
  }

  assignTechnicianToWorkItem(mapping: WorkItemTechnicianMapping): void {
    this.workItemTechnicians.set(mapping.workItemId, mapping.technicianId);
  }

  getVehicleForMaintenance(maintenanceId: string): string | null {
    return this.maintenanceVehicles.get(maintenanceId) ?? null;
  }

  linkMaintenanceToVehicle(maintenanceId: string, vehicleId: string): void {
    this.maintenanceVehicles.set(maintenanceId, vehicleId);
  }

  clear(): void {
    this.maintenanceContexts.clear();
    this.vehicles.clear();
    this.clients.clear();
    this.technicians.clear();
    this.workItemTechnicians.clear();
    this.maintenanceVehicles.clear();
  }
}
