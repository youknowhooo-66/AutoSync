import { Invoice, ServiceInvoice } from '@autosync/domain';

export interface IFiscalRepository {
  saveInvoice(invoice: Invoice): Promise<void>;
  saveServiceInvoice(serviceInvoice: ServiceInvoice): Promise<void>;
}
