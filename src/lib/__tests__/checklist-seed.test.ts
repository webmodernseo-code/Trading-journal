import { describe, it, expect } from 'vitest';
import { DEFAULT_CHECKLIST_RULES } from '../checklist-seed';

describe('DEFAULT_CHECKLIST_RULES', () => {
  it('contains four error/violation-phrased rules matching the errors-analytics polarity (checked = mistake happened)', () => {
    expect(DEFAULT_CHECKLIST_RULES).toEqual([
      'Plan non respecté',
      'Revenge trading',
      'Taille de position incorrecte',
      'Stop loss absent',
    ]);
  });
});
