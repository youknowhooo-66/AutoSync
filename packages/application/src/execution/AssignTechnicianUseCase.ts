import { TechnicalAssignment } from '@autosync/domain';
import { IExecutionRepository } from './IExecutionRepository';
import { IEventBus } from '../shared/IEventBus';

export interface AssignTechnicianInputDTO {
  workItemId: string;
  technicianId: string;
  specialty: string;
  correlationId: string;
}

export interface AssignTechnicianOutputDTO {
  assignmentId: string;
}

export class AssignTechnicianUseCase {
  constructor(
    private readonly executionRepo: IExecutionRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: AssignTechnicianInputDTO): Promise<AssignTechnicianOutputDTO> {
    // 1. Criar novo assignment (Agregado raiz dentro do escopo de execução, operando via WorkItem)
    const assignment = TechnicalAssignment.create({
      workItemId: input.workItemId,
      userId: input.technicianId,
      specialty: input.specialty,
    });

    // 2. Persistir
    await this.executionRepo.saveAssignment(assignment);

    // 3. (Sem eventos específicos de assignment no momento baseados no event-contracts.md, mas se houvesse, despacharíamos aqui)
    // await this.eventBus.dispatchAll(assignment.domainEvents);

    return {
      assignmentId: assignment.id.value,
    };
  }
}
