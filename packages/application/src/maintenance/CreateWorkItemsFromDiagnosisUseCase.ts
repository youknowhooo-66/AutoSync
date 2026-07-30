import { WorkItemType } from '@autosync/domain';
import { IMaintenanceRepository } from './IMaintenanceRepository';
import { IEventBus } from '../shared/IEventBus';

export interface DiagnosisItemDTO {
  type: WorkItemType;
  description: string;
  estimatedValue: number;
}

export interface CreateWorkItemsFromDiagnosisInputDTO {
  maintenanceId: string;
  diagnosisItems: DiagnosisItemDTO[];
  correlationId: string;
}

export interface CreateWorkItemsFromDiagnosisOutputDTO {
  workItemIds: string[];
}

export class CreateWorkItemsFromDiagnosisUseCase {
  constructor(
    private readonly maintenanceRepo: IMaintenanceRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(
    input: CreateWorkItemsFromDiagnosisInputDTO,
  ): Promise<CreateWorkItemsFromDiagnosisOutputDTO> {
    // 1. Carregar Aggregate
    const maintenance = await this.maintenanceRepo.findById(input.maintenanceId);
    if (!maintenance) {
      throw new Error(`Maintenance "${input.maintenanceId}" not found`);
    }

    // 2. Executar Regra de Domínio
    const workItemIds: string[] = [];

    for (const item of input.diagnosisItems) {
      const workItem = maintenance.addWorkItem({
        type: item.type,
        description: item.description,
        estimatedValue: item.estimatedValue,
        correlationId: input.correlationId,
      });
      workItemIds.push(workItem.id.value);
    }

    // 3. Persistir Aggregate
    await this.maintenanceRepo.save(maintenance);

    // 4. Despachar Eventos (WorkItemCreated.v1 x N)
    await this.eventBus.dispatchAll(maintenance.domainEvents);
    maintenance.clearEvents();

    return {
      workItemIds,
    };
  }
}
