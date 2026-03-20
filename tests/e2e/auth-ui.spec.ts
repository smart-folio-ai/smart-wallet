import {expect, test} from '@playwright/test';

test.describe('Auth UI', () => {
  test('renderiza a tela de login', async ({page}) => {
    await page.goto('/');

    await expect(page.getByRole('heading', {name: 'Login'})).toBeVisible();
    await expect(page.getByLabel('E-mail')).toBeVisible();
    await expect(page.getByLabel('Senha')).toBeVisible();
    await expect(page.getByRole('button', {name: 'Log In'})).toBeVisible();
  });

  test('navega do login para recuperar senha', async ({page}) => {
    await page.goto('/');
    await page.getByRole('link', {name: 'Esqueceu sua senha?'}).click();

    await expect(
      page.getByRole('heading', {name: 'Recuperar senha'}),
    ).toBeVisible();
    await expect(
      page.getByRole('button', {name: 'Enviar instruções'}),
    ).toBeVisible();
  });

  test('navega do login para criar conta', async ({page}) => {
    await page.goto('/');
    await page.getByRole('button', {name: 'Criar conta agora'}).click();

    await expect(
      page.getByRole('heading', {name: 'Criar conta'}),
    ).toBeVisible();
    await expect(page.getByLabel('Nome', {exact: true})).toBeVisible();
    await expect(page.getByLabel('Sobrenome', {exact: true})).toBeVisible();
  });

  test('exibe estado de link invalido em reset-password sem token', async ({
    page,
  }) => {
    await page.goto('/reset-password');

    await expect(
      page.getByRole('heading', {name: 'Link Inválido ou Expirado'}),
    ).toBeVisible();
    await expect(
      page.getByRole('button', {name: 'Solicitar novo link'}),
    ).toBeVisible();
  });
});
