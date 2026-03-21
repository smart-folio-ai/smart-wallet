import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

// Mock do localStorage
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    Object.keys(store).forEach((k) => delete store[k]);
  }),
};
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock do window.location
Object.defineProperty(window, 'location', {
  value: {href: ''},
  writable: true,
});

// Importar o apiClient e os interceptores
// O import deve vir DEPOIS do mock do localStorage para que os interceptores
// já enxerguem o localStorage mockado ao serem executados.
const {default: apiClient} = await import('@/server/api/api');
await import('./interceptors');

const REFRESH_URL =
  (import.meta.env.VITE_API_URL_DEVELOPMENT ?? 'http://localhost:3000') +
  '/auth/refresh-token';

describe('Interceptors — Request', () => {
  let mock: InstanceType<typeof MockAdapter>;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    mock.reset();
  });

  it('deve adicionar Bearer token ao header se houver access_token', async () => {
    localStorageMock.setItem('access_token', 'token-valido');
    mock.onGet('/test').reply(200, {ok: true});

    const res = await apiClient.get('/test');

    expect(mock.history.get[0].headers!['Authorization']).toBe(
      'Bearer token-valido',
    );
    expect(res.status).toBe(200);
  });

  it('não deve adicionar Authorization se não houver token', async () => {
    mock.onGet('/test').reply(200);

    await apiClient.get('/test');

    expect(mock.history.get[0].headers!['Authorization']).toBeUndefined();
  });
});

describe('Interceptors — Response (Refresh Token)', () => {
  let mockApi: InstanceType<typeof MockAdapter>;
  let mockAxios: InstanceType<typeof MockAdapter>;

  beforeEach(() => {
    mockApi = new MockAdapter(apiClient);
    mockAxios = new MockAdapter(axios);
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    mockApi.reset();
    mockAxios.reset();
  });

  it('deve renovar token e retentar requisição ao receber 401', async () => {
    localStorageMock.setItem('access_token', 'token-expirado');
    localStorageMock.setItem('refresh_token', 'refresh-valido');

    // 1ª chamada → 401; 2ª (retry após refresh) → 200
    mockApi
      .onGet('/protected')
      .replyOnce(401)
      .onGet('/protected')
      .reply(200, {data: 'ok'});

    // Endpoint de refresh retorna novo token
    mockAxios.onPost(REFRESH_URL).reply(200, {accessToken: 'novo-token'});

    const res = await apiClient.get('/protected');

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'access_token',
      'novo-token',
    );
    expect(mockApi.history?.get?.[1]?.headers?.['Authorization']).toBe(
      'Bearer novo-token',
    );
    expect(res.data).toEqual({data: 'ok'});
  });

  it('deve limpar tokens e redirecionar para / se o refresh falhar', async () => {
    localStorageMock.setItem('access_token', 'token-expirado');
    localStorageMock.setItem('refresh_token', 'refresh-invalido');

    mockApi.onGet('/protected').reply(401);
    mockAxios.onPost(REFRESH_URL).reply(401);

    await expect(apiClient.get('/protected')).rejects.toThrow();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
    expect(window.location.href).toBe('/');
  });

  it('deve propagar erro sem tentar refresh quando não há refresh_token', async () => {
    localStorageMock.setItem('access_token', 'token-expirado');
    // refresh_token NÃO está no store

    mockApi.onGet('/protected').reply(401);

    await expect(apiClient.get('/protected')).rejects.toThrow();

    // O endpoint de refresh NÃO deve ter sido chamado
    expect(mockAxios.history.post?.length ?? 0).toBe(0);
  });
});
