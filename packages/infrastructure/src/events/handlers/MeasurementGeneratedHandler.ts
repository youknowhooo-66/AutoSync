import { MeasurementGeneratedV1 } from '@autosync/domain';
import { IssueInvoiceUseCase } from '@autosync/application';

export class MeasurementGeneratedHandler {
  constructor(
    private readonly issueInvoiceUseCase: IssueInvoiceUseCase,
  ) {}

  async handle(event: MeasurementGeneratedV1): Promise<void> {
    const { totalValue, measurementId } = event.payload;

    await this.issueInvoiceUseCase.execute({
      companyId: event.companyId,
      referenceId: measurementId, // referencing the measurement
      type: 'NFSE',
      totalValue,
      correlationId: event.correlationId,
    });

    console.log(`[MeasurementGeneratedHandler] Issued NFS-e for measurement value ${totalValue}`);
  }
}
