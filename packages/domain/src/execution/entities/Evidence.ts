import { Entity } from '../../shared/Entity';
import { UniqueEntityId } from '../../shared/UniqueEntityId';
import { EvidenceType } from '../value-objects/EvidenceType';

export interface EvidenceProps {
  readonly maintenanceId: UniqueEntityId;
  readonly workItemId: UniqueEntityId | null;
  readonly userId: UniqueEntityId;
  readonly type: EvidenceType;
  readonly fileUrl: string;
  readonly description: string;
  readonly createdAt: Date;
}

/**
 * Evidence — immutable audit record for a Maintenance or WorkItem.
 *
 * Rules (aggregates-design.md): Evidence is immutable.
 * Rules (domain-prisma-mapping.md): Evidence = immutable storage reference.
 * Rules (DOMAIN_BLUEPRINT.md): Evidence is a domain entity, not just an attachment.
 *
 * No mutation methods exist on this class. Each evidence is a permanent fact.
 * The fileUrl is a reference to external storage — the domain does not own the file.
 */
export class Evidence extends Entity<EvidenceProps> {
  private constructor(props: EvidenceProps, id?: UniqueEntityId) {
    super(props, id);
  }

  get maintenanceId(): UniqueEntityId { return this._props.maintenanceId; }
  get workItemId(): UniqueEntityId | null { return this._props.workItemId; }
  get userId(): UniqueEntityId { return this._props.userId; }
  get type(): EvidenceType { return this._props.type; }
  get fileUrl(): string { return this._props.fileUrl; }
  get description(): string { return this._props.description; }
  get createdAt(): Date { return this._props.createdAt; }

  static create(
    props: {
      maintenanceId: string;
      workItemId?: string;
      userId: string;
      type: EvidenceType;
      fileUrl: string;
      description: string;
    },
    id?: UniqueEntityId,
  ): Evidence {
    return new Evidence(
      {
        maintenanceId: new UniqueEntityId(props.maintenanceId),
        workItemId: props.workItemId ? new UniqueEntityId(props.workItemId) : null,
        userId: new UniqueEntityId(props.userId),
        type: props.type,
        fileUrl: props.fileUrl,
        description: props.description,
        createdAt: new Date(),
      },
      id,
    );
  }

  static reconstitute(props: EvidenceProps, id: UniqueEntityId): Evidence {
    return new Evidence(props, id);
  }
}
