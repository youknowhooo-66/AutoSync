import { WorkItemCompletedV1 } from '@autosync/domain';
import { 
  GenerateMeasurementUseCase, 
  GenerateAccountsUseCase 
} from '@autosync/application';

export class WorkItemCompletedHandler {
  constructor(
    private readonly generateMeasurementUseCase: GenerateMeasurementUseCase,
    private readonly generateAccountsUseCase: GenerateAccountsUseCase,
  ) {}

  async handle(event: WorkItemCompletedV1): Promise<void> {
    const { workItemId, totalCost } = event.payload;

    // In a real scenario, the Measurement aggregates multiple WorkItems.
    // Here we generate one per completion for the orchestration flow.
    const { measurementId } = await this.generateMeasurementUseCase.execute({
      companyId: event.companyId,
      contractId: 'contract-id-1', // Fetched from fleet context usually
      periodStart: new Date(),
      periodEnd: new Date(),
      totalValue: totalCost,
      workItemIds: [workItemId],
      correlationId: event.correlationId,
    });

    // Generate Account Receivable
    await this.generateAccountsUseCase.execute({
      type: 'RECEIVABLE',
      partnerId: 'client-id-1', // Fetched via maintenance
      value: totalCost,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    console.log(`[WorkItemCompletedHandler] Generated measurement and accounts for WorkItem ${workItemId}`);
  }
}
