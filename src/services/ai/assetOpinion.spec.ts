import {beforeEach, describe, expect, it, vi} from 'vitest';

const {assetOpinionMock} = vi.hoisted(() => ({
  assetOpinionMock: vi.fn(),
}));

vi.mock('@/services/ai', () => ({
  aiAnalysisService: {
    assetOpinion: assetOpinionMock,
  },
}));

import {getAssetOpinion} from './assetOpinion';

const fakeResponse = {
  symbol: 'PETR4',
  summary: 'PETR4 apresenta qualidade sólida no padrão Trackerr (score 72/100).',
  strength: 'ROE acima de 15%',
  attention: 'Concentração acima do limite',
  tags: ['score_72', 'qualidade', 'valuation'],
  scoreOverall: 72,
  status: 'ok' as const,
};

describe('assetOpinion service (web)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('repassa o symbol e devolve a resposta do endpoint sem transformar', async () => {
    assetOpinionMock.mockResolvedValue(fakeResponse);

    const opinion = await getAssetOpinion('PETR4');

    expect(assetOpinionMock).toHaveBeenCalledWith('PETR4');
    expect(opinion).toEqual(fakeResponse);
  });

  it('propaga o erro em vez de mascarar com um fallback local', async () => {
    // Composição, texto e fallback (inclusive o caso de dado degradado)
    // agora vivem inteiramente no server (AssetOpinionService) — este
    // arquivo é só transporte, sem lógica própria para testar aqui.
    assetOpinionMock.mockRejectedValue(new Error('network error'));

    await expect(getAssetOpinion('PETR4')).rejects.toThrow('network error');
  });
});
