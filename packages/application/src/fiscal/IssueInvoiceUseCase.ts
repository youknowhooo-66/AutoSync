import { Invoice, ServiceInvoice, InvoiceType } from '@autosync/domain';
import { IFiscalRepository } from './IFiscalRepository';
import { IEventBus } from '../shared/IEventBus';

export interface IssueInvoiceInputDTO {
  companyId: string;
  referenceId: string; // MeasurementId ou PurchaseId
  type: 'NFE' | 'NFSE';
  totalValue: number;
  invoiceNumber?: string; // Required for NFE
  xml?: string; // Required for NFE
  correlationId: string;
}

export interface IssueInvoiceOutputDTO {
  invoiceId: string;
}

export class IssueInvoiceUseCase {
  constructor(
    private readonly fiscalRepo: IFiscalRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: IssueInvoiceInputDTO): Promise<IssueInvoiceOutputDTO> {
    if (input.type === 'NFSE') {
      // 1. Criar Service Invoice (Nota Fiscal de Serviço)
      const serviceInvoice = ServiceInvoice.create({
        companyId: input.companyId,
        maintenanceId: input.referenceId, // For NFSE, reference is the maintenance
        totalValue: input.totalValue,
      });

      // Issue para mudar status e gerar evento InvoiceIssued.v1
      serviceInvoice.issue(input.correlationId);

      // 2. Persistir
      await this.fiscalRepo.saveServiceInvoice(serviceInvoice);

      // 3. Despachar Evento
      await this.eventBus.dispatchAll(serviceInvoice.domainEvents);
      serviceInvoice.clearEvents();

      return {
        invoiceId: serviceInvoice.id.value,
      };
    } else {
      // 1. Criar Invoice (Nota Fiscal de Produto)
      if (!input.invoiceNumber || !input.xml) {
        throw new Error('Invoice Number and XML are required for NF-e');
      }

      const invoice = Invoice.create({
        companyId: input.companyId,
        number: input.invoiceNumber,
        xml: input.xml,
        type: InvoiceType.OUT, // Assuming it's an outgoing invoice for parts sold
        totalValue: input.totalValue,
        correlationId: input.correlationId,
      });

      // 2. Persistir
      await this.fiscalRepo.saveInvoice(invoice);

      // 3. Despachar Evento
      await this.eventBus.dispatchAll(invoice.domainEvents);
      invoice.clearEvents();

      return {
        invoiceId: invoice.id.value,
      };
    }
  }
}
