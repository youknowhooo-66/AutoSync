import { Measurement } from '@autosync/domain';
import { IFinanceRepository } from './IFinanceRepository';
import { IEventBus } from '../shared/IEventBus';

export interface GenerateMeasurementInputDTO {
  companyId: string;
  contractId: string;
  periodStart: Date;
  periodEnd: Date;
  totalValue: number;
  workItemIds?: string[];
  correlationId: string;
}

export interface GenerateMeasurementOutputDTO {
  measurementId: string;
}

export class GenerateMeasurementUseCase {
  constructor(
    private readonly financeRepo: IFinanceRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: GenerateMeasurementInputDTO): Promise<GenerateMeasurementOutputDTO> {
    // Domínio: Cria a Measurement (Agrupa WorkItems concluídos do período)
    const measurement = Measurement.create({
      companyId: input.companyId,
      contractId: input.contractId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      totalValue: input.totalValue,
      workItemIds: input.workItemIds,
      correlationId: input.correlationId,
    });

    await this.financeRepo.save(measurement);

    // Emite MeasurementGenerated.v1
    await this.eventBus.dispatchAll(measurement.domainEvents);
    measurement.clearEvents();

    return {
      measurementId: measurement.id.value,
    };
  }
}
