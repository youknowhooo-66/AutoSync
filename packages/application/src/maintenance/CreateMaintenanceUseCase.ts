import { Maintenance } from '@autosync/domain';
import { IMaintenanceRepository } from './IMaintenanceRepository';
import { IEventBus } from '../shared/IEventBus';

export interface CreateMaintenanceInputDTO {
  companyId: string;
  clientId: string;
  vehicleId: string;
  correlationId: string;
}

export interface CreateMaintenanceOutputDTO {
  maintenanceId: string;
}

export class CreateMaintenanceUseCase {
  constructor(
    private readonly maintenanceRepo: IMaintenanceRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: CreateMaintenanceInputDTO): Promise<CreateMaintenanceOutputDTO> {
    // 1. Executar Regra de Domínio
    const maintenance = Maintenance.open({
      companyId: input.companyId,
      clientId: input.clientId,
      vehicleId: input.vehicleId,
      correlationId: input.correlationId,
    });

    // 2. Persistir Aggregate (Transacional)
    await this.maintenanceRepo.save(maintenance);

    // 3. Despachar Eventos de Domínio (MaintenanceCreated.v1)
    await this.eventBus.dispatchAll(maintenance.domainEvents);

    // Limpar eventos após o dispatch (boa prática)
    maintenance.clearEvents();

    return {
      maintenanceId: maintenance.id.value,
    };
  }
}
