import { Entity } from '../../shared/Entity';
import { UniqueEntityId } from '../../shared/UniqueEntityId';
import {
  MaintenanceRequestStatus,
  MaintenanceRequestPriority,
} from '../value-objects/MaintenanceEnums';

export interface MaintenanceRequestProps {
  readonly clientId: UniqueEntityId;
  readonly vehicleId: UniqueEntityId;
  readonly status: MaintenanceRequestStatus;
  readonly priority: MaintenanceRequestPriority;
  readonly createdAt: Date;
}

/**
 * MaintenanceRequest — the entry point of the maintenance lifecycle.
 * A client or scheduler creates a request before a Maintenance is opened.
 *
 * Rule (DOMAIN_BLUEPRINT.md): Flow starts with Solicitação (Request).
 */
export class MaintenanceRequest extends Entity<MaintenanceRequestProps> {
  private _status: MaintenanceRequestStatus;

  private constructor(props: MaintenanceRequestProps, id?: UniqueEntityId) {
    super(props, id);
    this._status = props.status;
  }

  get clientId(): UniqueEntityId { return this._props.clientId; }
  get vehicleId(): UniqueEntityId { return this._props.vehicleId; }
  get status(): MaintenanceRequestStatus { return this._status; }
  get priority(): MaintenanceRequestPriority { return this._props.priority; }
  get createdAt(): Date { return this._props.createdAt; }

  schedule(): void {
    this._status = MaintenanceRequestStatus.SCHEDULED;
  }

  accept(): void {
    this._status = MaintenanceRequestStatus.ACCEPTED;
  }

  cancel(): void {
    this._status = MaintenanceRequestStatus.CANCELLED;
  }

  static create(
    props: {
      clientId: string;
      vehicleId: string;
      priority?: MaintenanceRequestPriority;
    },
    id?: UniqueEntityId,
  ): MaintenanceRequest {
    return new MaintenanceRequest(
      {
        clientId: new UniqueEntityId(props.clientId),
        vehicleId: new UniqueEntityId(props.vehicleId),
        status: MaintenanceRequestStatus.OPEN,
        priority: props.priority ?? MaintenanceRequestPriority.MEDIUM,
        createdAt: new Date(),
      },
      id,
    );
  }

  static reconstitute(props: MaintenanceRequestProps, id: UniqueEntityId): MaintenanceRequest {
    return new MaintenanceRequest(props, id);
  }
}
