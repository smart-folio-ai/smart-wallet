import {describe, expect, it, vi} from 'vitest';
import {resolveCapability} from './useSubscription';

describe('resolveCapability', () => {
  it('usa a lista do server quando ela vem na resposta', () => {
    const legacy = vi.fn(() => true);

    expect(resolveCapability(['research.comparator'], 'research.comparator', legacy)).toBe(true);
    expect(resolveCapability(['research.comparator'], 'ri.ai_summary', legacy)).toBe(false);
    expect(legacy).not.toHaveBeenCalled();
  });

  it('lista vazia do server nega tudo, sem cair na regra antiga', () => {
    const legacy = vi.fn(() => true);

    expect(resolveCapability([], 'ai.insights', legacy)).toBe(false);
    expect(legacy).not.toHaveBeenCalled();
  });

  it('server sem o campo cai na regra antiga', () => {
    expect(resolveCapability(undefined, 'ri.ai_summary', () => true)).toBe(true);
    expect(resolveCapability(undefined, 'ri.ai_summary', () => false)).toBe(false);
  });
});
