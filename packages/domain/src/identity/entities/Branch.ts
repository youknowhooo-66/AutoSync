import { Entity } from '../../shared/Entity';
import { UniqueEntityId } from '../../shared/UniqueEntityId';

export interface BranchProps {
  readonly companyId: UniqueEntityId;
  readonly name: string;
  readonly address: string;
}

/**
 * Branch entity — represents a physical unit (filial) of a Company.
 * Rule (aggregates-design.md): Branch is isolated within the Company.
 * Branch belongs to Company; cross-company access is not allowed.
 */
export class Branch extends Entity<BranchProps> {
  private constructor(props: BranchProps, id?: UniqueEntityId) {
    super(props, id);
  }

  get companyId(): UniqueEntityId {
    return this._props.companyId;
  }

  get name(): string {
    return this._props.name;
  }

  get address(): string {
    return this._props.address;
  }

  belongsToCompany(companyId: UniqueEntityId): boolean {
    return this._props.companyId.equals(companyId);
  }

  static create(
    props: { companyId: string; name: string; address: string },
    id?: UniqueEntityId,
  ): Branch {
    return new Branch(
      {
        companyId: new UniqueEntityId(props.companyId),
        name: props.name,
        address: props.address,
      },
      id,
    );
  }

  static reconstitute(props: BranchProps, id: UniqueEntityId): Branch {
    return new Branch(props, id);
  }
}
