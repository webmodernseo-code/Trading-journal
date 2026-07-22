import { describe, it, expect } from 'vitest';
import { DEFAULT_CHECKLIST_RULES } from '../checklist-seed';

describe('DEFAULT_CHECKLIST_RULES', () => {
  it('contains the four rules from the spec', () => {
    expect(DEFAULT_CHECKLIST_RULES).toEqual([
      'Plan respecté',
      'Pas de revenge trading',
      'Taille de position correcte',
      'Stop loss placé avant l\'entrée',
    ]);
  });
});
