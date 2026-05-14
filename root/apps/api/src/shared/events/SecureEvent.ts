import { v4 as uuidv4 } from 'uuid';

export interface ISecureEvent {
  id: string; // Event Unique ID for Deduplication
  type: string;
  version: number;
  timestamp: number;
  companyId: string;
  payload: any;
  signature?: string; // For future signing
  correlationId: string;
  userId: string;
}

export function createSecureEvent(
  type: string, 
  companyId: string, 
  userId: string, 
  payload: any, 
  correlationId: string
): ISecureEvent {
  return {
    id: uuidv4(),
    type,
    version: 1,
    timestamp: Date.now(),
    companyId,
    userId,
    payload,
    correlationId,
  };
}
