import { Entity } from '../../shared/Entity';
import { UniqueEntityId } from '../../shared/UniqueEntityId';
import { ClientType } from '../value-objects/FleetEnums';

export interface ClientProps {
  readonly companyId: UniqueEntityId;
  readonly type: ClientType;
  readonly name: string;
  readonly document: string;
  readonly phone: string;
  readonly email: string;
}

/**
 * Client entity — represents an external entity (private or public-sector).
 * Rule (bounded-contexts.md): Fleet context represents entities external
 * to the operational system; it does not execute maintenance logic.
 */
export class Client extends Entity<ClientProps> {
  private constructor(props: ClientProps, id?: UniqueEntityId) {
    super(props, id);
  }

  get companyId(): UniqueEntityId {
    return this._props.companyId;
  }

  get type(): ClientType {
    return this._props.type;
  }

  get name(): string {
    return this._props.name;
  }

  get document(): string {
    return this._props.document;
  }

  get phone(): string {
    return this._props.phone;
  }

  get email(): string {
    return this._props.email;
  }

  isPublicSector(): boolean {
    return this._props.type === ClientType.PUBLIC;
  }

  static create(
    props: {
      companyId: string;
      type: ClientType;
      name: string;
      document: string;
      phone: string;
      email: string;
    },
    id?: UniqueEntityId,
  ): Client {
    return new Client(
      {
        ...props,
        companyId: new UniqueEntityId(props.companyId),
      },
      id,
    );
  }

  static reconstitute(props: ClientProps, id: UniqueEntityId): Client {
    return new Client(props, id);
  }
}
