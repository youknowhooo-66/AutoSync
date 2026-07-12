import { CreateFinancialEntryService } from '../modules/financial/services/CreateFinancialEntryService';
import { UpdateFinancialEntryService } from '../modules/financial/services/UpdateFinancialEntryService';
import { PrismaFinancialEntryRepository } from '../modules/financial/repositories/PrismaFinancialEntryRepository';

export class FinanceCompatibilityAdapter {
  constructor(
    private createFinancialEntryService: CreateFinancialEntryService,
    private updateFinancialEntryService: UpdateFinancialEntryService,
    private financialRepository: PrismaFinancialEntryRepository
  ) {}

  createFinancialEntry = {
    execute: async (payload: any) => {
      const result = await this.createFinancialEntryService.execute({
        description: payload.description || 'New Entry',
        categoryId: payload.categoryId || null,
        date: payload.date || new Date(),
        ...payload
      });
      return result.id;
    }
  };

  updateFinancialEntry = {
    execute: async (payload: any) => {
      return this.updateFinancialEntryService.execute({
        id: payload.entryId,
        ...payload
      });
    }
  };

  financialQueryService = {
    getFinancialEntryById: async (id: string, companyId: string) => {
      return this.financialRepository.findById(id, companyId);
    }
  };
}

export const createFinanceAdapter = () => {
  const financialRepo = new PrismaFinancialEntryRepository();
  return new FinanceCompatibilityAdapter(
    new CreateFinancialEntryService(financialRepo),
    new UpdateFinancialEntryService(financialRepo),
    financialRepo
  );
};
