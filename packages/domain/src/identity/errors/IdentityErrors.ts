import { DomainError } from '../../shared/errors/DomainError';

export class InvalidDocumentError extends DomainError {
  constructor(document: string) {
    super(`Invalid document (CNPJ/CPF): "${document}"`);
    this.name = 'InvalidDocumentError';
  }
}

export class InvalidEmailError extends DomainError {
  constructor(email: string) {
    super(`Invalid email address: "${email}"`);
    this.name = 'InvalidEmailError';
  }
}

export class CompanyAlreadyHasBranchError extends DomainError {
  constructor(branchId: string) {
    super(`Company already contains branch with id "${branchId}"`);
    this.name = 'CompanyAlreadyHasBranchError';
  }
}

export class UserMustBelongToCompanyError extends DomainError {
  constructor() {
    super('A User must belong to a Company before being assigned to a Branch.');
    this.name = 'UserMustBelongToCompanyError';
  }
}

export class RolePermissionsEmptyError extends DomainError {
  constructor() {
    super('A Role must define at least one permission.');
    this.name = 'RolePermissionsEmptyError';
  }
}
