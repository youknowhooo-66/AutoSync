import { TechnicalAssignment, Evidence } from '@autosync/domain';

export interface IExecutionRepository {
  findAssignmentById(id: string): Promise<TechnicalAssignment | null>;
  saveAssignment(assignment: TechnicalAssignment): Promise<void>;
  
  saveTimeEntry(timeEntry: any): Promise<void>;
  
  saveEvidence(evidence: Evidence): Promise<void>;
}
