import type {Page} from '@playwright/test';
import {test, expect} from './helpers/base-test';
import {createFakeAccessToken} from './helpers/fake-jwt';

/**
 * Smoke de todas as rotas com o backend fora do ar: toda chamada que sai do
 * próprio app responde 503. Cada página precisa renderizar sem erro de JS
 * não tratado, sem tela branca e sem cair no 404 — é o mínimo de resiliência
 * esperado sem depender do formato de cada resposta da API.
 */
const PUBLIC_ROUTES = [
  '/',
  '/signin',
  '/register',
  '/forgot-password',
  '/reset-password?token=e2e',
  '/privacidade',
  '/termos',
  '/cookies',
];

const APP_ROUTES = [
  '/dashboard',
  '/portfolio',
  '/portfolio/PETR4',
  '/portfolio/asset/507f1f77bcf86cd799439011',
  '/portfolio/asset/symbol/PETR4',
  '/transactions',
  '/add-asset',
  '/dividends',
  '/dividends/PETR4',
  '/ai-insights',
  '/chat-inteligente',
  '/ri-inteligente',
  '/asset-search',
  '/asset/PETR4',
  '/comparator',
  '/planning',
  '/fiscal',
  '/reports',
  '/sync-accounts',
  '/subscription',
  '/plans',
  '/subscription-success',
  '/subscription-cancelled',
  '/settings',
  '/security',
];

const ADMIN_ROUTES = ['/admin', '/admin/plans', '/admin/grants'];

async function backendDown(page: Page) {
  const appOrigin = new URL(test.info().project.use.baseURL as string).origin;
  await page.route(
    (url) => url.origin !== appOrigin,
    (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({message: 'indisponível (e2e)'}),
      }),
  );
}

async function signIn(page: Page, role: 'user' | 'admin') {
  const token = createFakeAccessToken({role});
  await page.addInitScript((value: string) => {
    localStorage.setItem('access_token', value);
    localStorage.setItem('refresh_token', 'e2e-refresh-token');
  }, token);
}

async function visit(page: Page, path: string) {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(path);
  await page.waitForLoadState('networkidle').catch(() => undefined);
  // Página que só mostra spinner enquanto o React Query refaz a chamada
  // (3 tentativas com backoff) ganha tempo até sair do carregamento.
  await expect
    .poll(async () => (await page.locator('body').innerText()).trim().length, {timeout: 15_000})
    .toBeGreaterThan(20)
    .catch(() => undefined);

  const bodyText = (await page.locator('body').innerText()).trim();
  return {pageErrors, bodyText, url: page.url()};
}

for (const path of PUBLIC_ROUTES) {
  test(`pública ${path} renderiza com o backend fora`, async ({page}) => {
    await backendDown(page);
    const {pageErrors, bodyText} = await visit(page, path);

    expect(pageErrors, `erro de JS em ${path}`).toEqual([]);
    expect(bodyText.length, `tela branca em ${path}`).toBeGreaterThan(20);
    expect(bodyText).not.toMatch(/página não encontrada|page not found|404/i);
  });
}

for (const path of APP_ROUTES) {
  test(`app ${path} renderiza com o backend fora`, async ({page}) => {
    await backendDown(page);
    await signIn(page, 'user');
    const {pageErrors, bodyText, url} = await visit(page, path);

    expect(pageErrors, `erro de JS em ${path}`).toEqual([]);
    expect(bodyText.length, `tela branca em ${path}`).toBeGreaterThan(20);
    expect(bodyText).not.toMatch(/página não encontrada|page not found/i);
    expect(new URL(url).pathname, `${path} redirecionou para fora do app`).not.toBe('/signin');
  });
}

for (const path of ADMIN_ROUTES) {
  test(`admin ${path} renderiza para admin e bloqueia usuário comum`, async ({page, browser}) => {
    await backendDown(page);
    await signIn(page, 'admin');
    const asAdmin = await visit(page, path);
    expect(asAdmin.pageErrors, `erro de JS em ${path}`).toEqual([]);
    expect(asAdmin.bodyText.length).toBeGreaterThan(20);
    expect(new URL(asAdmin.url).pathname).toBe(path);

    const context = await browser.newContext();
    const userPage = await context.newPage();
    await backendDown(userPage);
    await signIn(userPage, 'user');
    await userPage.goto(path);
    await userPage.waitForLoadState('networkidle').catch(() => undefined);
    expect(new URL(userPage.url()).pathname, `${path} abriu para usuário comum`).not.toBe(path);
    await context.close();
  });
}
