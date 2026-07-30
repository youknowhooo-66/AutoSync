import { describe, it, expect } from 'vitest';
import { TechnicalTimeEntry } from '../../execution/entities/TechnicalTimeEntry';
import { Evidence } from '../../execution/entities/Evidence';
import { EvidenceType } from '../../execution/value-objects/EvidenceType';
import { InvalidTimeEntryError } from '../../execution/errors/ExecutionErrors';

describe('Execution Context Integrity', () => {
  describe('TechnicalTimeEntry Append-Only rules', () => {
    it('should create a valid TimeEntry and calculate hours correctly', () => {
      const start = new Date('2023-01-01T10:00:00Z');
      const end = new Date('2023-01-01T12:30:00Z');

      const entry = TechnicalTimeEntry.create({
        assignmentId: 'assign-123',
        workItemId: 'wi-123',
        startTime: start,
        endTime: end,
      });

      expect(entry.hours).toBe(2.5);
    });

    it('should reject invalid time ranges', () => {
      const start = new Date('2023-01-01T12:00:00Z');
      const end = new Date('2023-01-01T10:00:00Z'); // Before start

      expect(() => {
        TechnicalTimeEntry.create({
          assignmentId: 'assign-123',
          workItemId: 'wi-123',
          startTime: start,
          endTime: end,
        });
      }).toThrow(InvalidTimeEntryError);
    });

    it('should not have setter methods (append-only enforcement)', () => {
      const start = new Date('2023-01-01T10:00:00Z');
      const end = new Date('2023-01-01T12:30:00Z');

      const entry = TechnicalTimeEntry.create({
        assignmentId: 'assign-123',
        workItemId: 'wi-123',
        startTime: start,
        endTime: end,
      });

      // Verification that no set methods exist on the instance prototype
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(entry));
      const hasSetter = methods.some((m) => m.startsWith('set') || m.startsWith('update'));
      expect(hasSetter).toBe(false);
    });
  });

  describe('Evidence Immutability rules', () => {
    it('should create Evidence correctly', () => {
      const evidence = Evidence.create({
        maintenanceId: 'maint-123',
        userId: 'user-123',
        type: EvidenceType.BEFORE,
        fileUrl: 'https://storage.com/img.jpg',
        description: 'Before repairs',
      });

      expect(evidence.type).toBe(EvidenceType.BEFORE);
      expect(evidence.fileUrl).toBe('https://storage.com/img.jpg');
    });

    it('should be completely immutable without any mutator methods', () => {
      const evidence = Evidence.create({
        maintenanceId: 'maint-123',
        userId: 'user-123',
        type: EvidenceType.BEFORE,
        fileUrl: 'https://storage.com/img.jpg',
        description: 'Before repairs',
      });

      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(evidence));
      const hasMutator = methods.some(
        (m) => m.startsWith('set') || m.startsWith('update') || m === 'delete',
      );
      expect(hasMutator).toBe(false);
    });
  });
});
