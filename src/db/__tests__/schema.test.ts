import { describe, it, expect } from 'vitest';
import { users, instruments, strategies, checklistRules } from '../schema';

describe('schema', () => {
  it('exports all four tables', () => {
    expect(users).toBeDefined();
    expect(instruments).toBeDefined();
    expect(strategies).toBeDefined();
    expect(checklistRules).toBeDefined();
  });
});
