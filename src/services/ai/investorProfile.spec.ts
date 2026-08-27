import {describe, it, expect, vi} from 'vitest';

const getMock = vi.fn();
const putMock = vi.fn();

vi.mock('@/server/api/api', () => ({
  aiService: {
    getInvestorProfile: (...args: unknown[]) => getMock(...args),
    updateInvestorProfile: (...args: unknown[]) => putMock(...args),
  },
}));

import {getInvestorProfile, setInvestorProfileOverride} from './investorProfile';

describe('getInvestorProfile', () => {
  it('devolve os dados da resposta', async () => {
    getMock.mockResolvedValue({
      data: {
        sophistication: 'experienced',
        riskTolerance: 'aggressive',
        confidence: 0.9,
        signals: {},
        source: 'inferred',
      },
    });
    const result = await getInvestorProfile();
    expect(result.sophistication).toBe('experienced');
  });
});

describe('setInvestorProfileOverride', () => {
  it('envia o override e devolve o perfil atualizado', async () => {
    putMock.mockResolvedValue({
      data: {
        sophistication: 'experienced',
        riskTolerance: 'moderate',
        confidence: 0.7,
        signals: {},
        source: 'user_override',
      },
    });
    const result = await setInvestorProfileOverride({sophistication: 'experienced'});
    expect(putMock).toHaveBeenCalledWith({sophistication: 'experienced'});
    expect(result.source).toBe('user_override');
  });
});
