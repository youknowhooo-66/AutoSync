import { Entity } from '../../shared/Entity';
import { UniqueEntityId } from '../../shared/UniqueEntityId';

export interface VehicleTimelineProps {
  readonly vehicleId: UniqueEntityId;
  readonly eventType: string;
  readonly description: string;
  readonly createdAt: Date;
}

/**
 * VehicleTimeline entity — append-only historical record for a Vehicle.
 *
 * Rule (aggregates-design.md): Timeline is append-only.
 * Rule (domain-prisma-mapping.md): Never update in timeline.
 *
 * This entity is intentionally immutable: there are no setter methods.
 * Once created, state cannot change.
 */
export class VehicleTimeline extends Entity<VehicleTimelineProps> {
  private constructor(props: VehicleTimelineProps, id?: UniqueEntityId) {
    super(props, id);
  }

  get vehicleId(): UniqueEntityId {
    return this._props.vehicleId;
  }

  get eventType(): string {
    return this._props.eventType;
  }

  get description(): string {
    return this._props.description;
  }

  get createdAt(): Date {
    return this._props.createdAt;
  }

  static create(
    props: { vehicleId: string; eventType: string; description: string },
    id?: UniqueEntityId,
  ): VehicleTimeline {
    return new VehicleTimeline(
      {
        vehicleId: new UniqueEntityId(props.vehicleId),
        eventType: props.eventType,
        description: props.description,
        createdAt: new Date(),
      },
      id,
    );
  }

  static reconstitute(props: VehicleTimelineProps, id: UniqueEntityId): VehicleTimeline {
    return new VehicleTimeline(props, id);
  }
}
