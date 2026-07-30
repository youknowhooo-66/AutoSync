import { IExecutionRepository } from './IExecutionRepository';
import { IEventBus } from '../shared/IEventBus';
import { TechnicalTimeEntry, createTimeEntryRegisteredEvent } from '@autosync/domain';

export interface RegisterTimeEntryInputDTO {
  assignmentId: string;
  startTime: Date;
  endTime: Date;
  correlationId: string;
  companyId: string;
}

export class RegisterTimeEntryUseCase {
  constructor(
    private readonly executionRepo: IExecutionRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: RegisterTimeEntryInputDTO): Promise<void> {
    // 1. Carregar Assignment
    const assignment = await this.executionRepo.findAssignmentById(input.assignmentId);
    if (!assignment) {
      throw new Error(`Assignment "${input.assignmentId}" not found`);
    }

    // 2. Executar Regra de Domínio (Registrar tempo)
    const timeEntry = TechnicalTimeEntry.create({
      assignmentId: assignment.id.value,
      workItemId: assignment.workItemId.value,
      startTime: input.startTime,
      endTime: input.endTime,
    });

    // 3. Persistir
    await this.executionRepo.saveTimeEntry(timeEntry);

    // 4. Dispatch event
    const event = createTimeEntryRegisteredEvent(
      { workItemId: assignment.workItemId.value, hours: timeEntry.hours },
      { companyId: input.companyId, correlationId: input.correlationId }
    );
    await this.eventBus.dispatch(event);
  }
}
