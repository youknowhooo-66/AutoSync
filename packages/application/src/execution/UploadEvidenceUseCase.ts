import { Evidence, EvidenceType } from '@autosync/domain';
import { IExecutionRepository } from './IExecutionRepository';

export interface UploadEvidenceInputDTO {
  maintenanceId: string;
  userId: string;
  type: EvidenceType;
  fileUrl: string;
  description?: string;
}

export interface UploadEvidenceOutputDTO {
  evidenceId: string;
}

export class UploadEvidenceUseCase {
  constructor(private readonly executionRepo: IExecutionRepository) {}

  async execute(input: UploadEvidenceInputDTO): Promise<UploadEvidenceOutputDTO> {
    // Evidence is an immutable entity that is append-only.
    const evidence = Evidence.create({
      maintenanceId: input.maintenanceId,
      userId: input.userId,
      type: input.type,
      fileUrl: input.fileUrl,
      description: input.description ?? '',
    });

    // Persist immediately (append-only ledger)
    await this.executionRepo.saveEvidence(evidence);

    return {
      evidenceId: evidence.id.value,
    };
  }
}
