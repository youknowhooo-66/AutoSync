import { AccountPayable, AccountReceivable } from '@autosync/domain';
import { IFinanceRepository } from './IFinanceRepository';

export interface GenerateAccountsInputDTO {
  type: 'PAYABLE' | 'RECEIVABLE';
  partnerId: string; // supplierId or clientId
  value: number;
  dueDate: Date;
}

export interface GenerateAccountsOutputDTO {
  accountId: string;
}

export class GenerateAccountsUseCase {
  constructor(private readonly financeRepo: IFinanceRepository) {}

  async execute(input: GenerateAccountsInputDTO): Promise<GenerateAccountsOutputDTO> {
    if (input.type === 'PAYABLE') {
      const account = AccountPayable.create({
        supplierId: input.partnerId,
        value: input.value,
        dueDate: input.dueDate,
      });

      await this.financeRepo.savePayable(account);

      return {
        accountId: account.id.value,
      };
    } else {
      const account = AccountReceivable.create({
        clientId: input.partnerId,
        value: input.value,
        dueDate: input.dueDate,
      });

      await this.financeRepo.saveReceivable(account);

      return {
        accountId: account.id.value,
      };
    }
  }
}
