import {expect, test} from '@playwright/test';

test.describe('Landing And Protected Routes', () => {
  test('redireciona para landing quando rota protegida é acessada sem token', async ({
    page,
  }) => {
    await page.goto('/chat-inteligente');
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('button', {name: /Entrar/i}).first(),
    ).toBeVisible();
  });

  test('landing navega para login e cadastro pelos CTAs do header', async ({
    page,
  }) => {
    await page.goto('/');

    await page.getByRole('button', {name: 'Entrar'}).first().click();
    await expect(page).toHaveURL(/\/signin$/);

    await page.goto('/');
    await page.getByRole('button', {name: /Criar Conta/i}).first().click();
    await expect(page).toHaveURL(/\/register$/);
  });
});
