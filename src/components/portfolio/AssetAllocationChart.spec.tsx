import {describe, it, expect} from 'vitest';
import {treemapTooltipFormatter} from './AssetAllocationChart';

describe('treemapTooltipFormatter', () => {
  it('reads the asset name from entry.payload, the way Recharts delivers it for Treemap', () => {
    const [formattedValue, formattedName] = treemapTooltipFormatter(
      1872.03,
      undefined as unknown as string,
      {payload: {name: 'VBBR3'}},
    );

    expect(formattedName).toBe('VBBR3');
    expect(formattedName).not.toBe('undefined');
    expect(formattedValue).not.toContain('undefined');
  });
});
