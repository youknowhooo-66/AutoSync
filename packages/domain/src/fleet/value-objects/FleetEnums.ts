/**
 * VehicleType — allowed vehicle categories.
 * Source: ERD_DIAGRAM.md — Vehicle.type enum.
 */
export enum VehicleType {
  CAR = 'CAR',
  TRUCK = 'TRUCK',
  BUS = 'BUS',
  MOTORCYCLE = 'MOTORCYCLE',
  HEAVY = 'HEAVY',
}

/**
 * ClientType — distinguishes public-sector from private clients.
 * Source: ERD_DIAGRAM.md — Client.type enum.
 */
export enum ClientType {
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC',
}

/**
 * ContractStatus — lifecycle states for a Contract.
 */
export enum ContractStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
}
