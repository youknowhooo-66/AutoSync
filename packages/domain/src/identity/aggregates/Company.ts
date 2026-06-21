import { AggregateRoot } from '../../shared/AggregateRoot';
import { UniqueEntityId } from '../../shared/UniqueEntityId';
import { Document } from '../value-objects/Document';
import { Branch } from '../entities/Branch';
import { CompanyAlreadyHasBranchError } from '../errors/IdentityErrors';

export interface CompanyProps {
  readonly name: string;
  readonly document: Document;
  readonly createdAt: Date;
  readonly branches: Branch[];
}

/**
 * Company — Identity Aggregate Root.
 *
 * Rules (aggregates-design.md):
 *   - User belongs to a Company
 *   - Role defines permissions
 *   - Branch is isolated within the Company
 *   - No dependency on other contexts
 *
 * Company is the multi-tenant anchor. Every entity in the system
 * is ultimately scoped to a Company.
 */
export class Company extends AggregateRoot<CompanyProps> {
  private constructor(props: CompanyProps, id?: UniqueEntityId) {
    super(props, id);
  }

  // ─── Getters ────────────────────────────────────────────────────────────────

  get name(): string {
    return this._props.name;
  }

  get document(): Document {
    return this._props.document;
  }

  get createdAt(): Date {
    return this._props.createdAt;
  }

  get branches(): ReadonlyArray<Branch> {
    return this._props.branches;
  }

  // ─── Domain Methods ──────────────────────────────────────────────────────────

  /**
   * Adds a Branch to this Company.
   * Invariant: a Branch with the same id cannot be added twice.
   */
  addBranch(branch: Branch): void {
    const alreadyExists = this._props.branches.some((b) => b.id.equals(branch.id));
    if (alreadyExists) {
      throw new CompanyAlreadyHasBranchError(branch.id.value);
    }
    this._props.branches.push(branch);
  }

  hasBranch(branchId: UniqueEntityId): boolean {
    return this._props.branches.some((b) => b.id.equals(branchId));
  }

  // ─── Factory ────────────────────────────────────────────────────────────────

  static create(
    props: { name: string; document: string },
    id?: UniqueEntityId,
  ): Company {
    return new Company(
      {
        name: props.name,
        document: Document.create(props.document),
        createdAt: new Date(),
        branches: [],
      },
      id,
    );
  }

  static reconstitute(props: CompanyProps, id: UniqueEntityId): Company {
    return new Company(props, id);
  }
}
