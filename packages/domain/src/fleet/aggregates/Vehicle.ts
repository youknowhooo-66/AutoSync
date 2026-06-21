import { AggregateRoot } from '../../shared/AggregateRoot';
import { UniqueEntityId } from '../../shared/UniqueEntityId';
import { Plate } from '../value-objects/Plate';
import { VehicleType } from '../value-objects/FleetEnums';
import { VehicleTimeline } from '../entities/VehicleTimeline';
import { VehicleMustHaveClientError } from '../errors/FleetErrors';

export interface VehicleProps {
  readonly clientId: UniqueEntityId;
  readonly branchId: UniqueEntityId;
  readonly plate: Plate;
  readonly chassis: string;
  readonly type: VehicleType;
  readonly mileage: number;
  readonly active: boolean;
  readonly timeline: VehicleTimeline[];
}

/**
 * Vehicle — Fleet Aggregate Root.
 *
 * Rules (aggregates-design.md):
 *   - Timeline is append-only (no delete/update)
 *   - Vehicle does NOT depend on Maintenance
 *
 * Rule (bounded-contexts.md):
 *   - Fleet context can emit events TO Maintenance but cannot execute
 *     maintenance logic itself.
 */
export class Vehicle extends AggregateRoot<VehicleProps> {
  private constructor(props: VehicleProps, id?: UniqueEntityId) {
    super(props, id);
  }

  // ─── Getters ────────────────────────────────────────────────────────────────

  get clientId(): UniqueEntityId { return this._props.clientId; }
  get branchId(): UniqueEntityId { return this._props.branchId; }
  get plate(): Plate { return this._props.plate; }
  get chassis(): string { return this._props.chassis; }
  get type(): VehicleType { return this._props.type; }
  get mileage(): number { return this._props.mileage; }
  get active(): boolean { return this._props.active; }
  get timeline(): ReadonlyArray<VehicleTimeline> { return this._props.timeline; }

  // ─── Domain Methods ──────────────────────────────────────────────────────────

  /**
   * Appends a new timeline entry.
   * Invariant: timeline is APPEND-ONLY — existing entries are never mutated.
   */
  recordEvent(eventType: string, description: string): VehicleTimeline {
    const entry = VehicleTimeline.create({
      vehicleId: this._id.value,
      eventType,
      description,
    });
    this._props.timeline.push(entry);
    return entry;
  }

  updateMileage(newMileage: number): void {
    if (newMileage < this._props.mileage) return; // mileage never goes backward
    (this._props as { mileage: number }).mileage = newMileage;
    this.recordEvent('MILEAGE_UPDATED', `Mileage updated to ${newMileage}`);
  }

  deactivate(): void {
    (this._props as { active: boolean }).active = false;
    this.recordEvent('DEACTIVATED', 'Vehicle deactivated');
  }

  // ─── Factory ────────────────────────────────────────────────────────────────

  static create(
    props: {
      clientId: string;
      branchId: string;
      plate: string;
      chassis: string;
      type: VehicleType;
      mileage?: number;
    },
    id?: UniqueEntityId,
  ): Vehicle {
    if (!props.clientId) throw new VehicleMustHaveClientError();

    return new Vehicle(
      {
        clientId: new UniqueEntityId(props.clientId),
        branchId: new UniqueEntityId(props.branchId),
        plate: Plate.create(props.plate),
        chassis: props.chassis,
        type: props.type,
        mileage: props.mileage ?? 0,
        active: true,
        timeline: [],
      },
      id,
    );
  }

  static reconstitute(props: VehicleProps, id: UniqueEntityId): Vehicle {
    return new Vehicle(props, id);
  }
}
