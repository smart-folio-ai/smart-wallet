import {expect, test} from '@playwright/test';

test.describe('Auth Navigation And Validation', () => {
  test('volta de recuperar senha para login pelo rodapé', async ({page}) => {
    await page.goto('/forgot-password');
    await page.getByRole('button', {name: 'Voltar para o login'}).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', {name: 'Login'})).toBeVisible();
  });

  test('volta de cadastro para login', async ({page}) => {
    await page.goto('/register');
    await page.getByRole('button', {name: 'Faça login agora'}).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', {name: 'Login'})).toBeVisible();
  });

  test('valida email inválido em recuperar senha', async ({page}) => {
    await page.goto('/forgot-password');
    await page.getByLabel('E-mail').fill('email-invalido');
    await page.getByRole('button', {name: 'Enviar instruções'}).click();
    await expect(page.getByText('Digite um email válido')).toBeVisible();
  });

  test('não avança no cadastro sem aceitar termos', async ({page}) => {
    await page.goto('/register');
    await page.locator('input[name="firstname"]').fill('Pedro');
    await page.locator('input[name="lastname"]').fill('Silva');
    await page.locator('input[name="email"]').fill('pedro@example.com');
    await page.locator('input[name="password"]').fill('Senha123!');
    await page.locator('input[name="confirmPassword"]').fill('Senha123!');
    await page.getByRole('button', {name: 'Criar Conta'}).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole('heading', {name: 'Criar conta'})).toBeVisible();
  });

  test('redefine senha com token inválido e abre solicitar novo link', async ({
    page,
  }) => {
    await page.goto('/reset-password?token=token-invalido');
    await expect(
      page.getByRole('heading', {name: 'Link Inválido ou Expirado'}),
    ).toBeVisible();
    await page.getByRole('button', {name: 'Solicitar novo link'}).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(
      page.getByRole('heading', {name: 'Recuperar senha'}),
    ).toBeVisible();
  });
});
