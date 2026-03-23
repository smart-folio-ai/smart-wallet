import {expect, test} from '@playwright/test';

test.describe('Auth Navigation And Validation', () => {
  test('volta de recuperar senha para login', async ({page}) => {
    await page.goto('/forgot-password');
    await page.locator('#forgot-password-back').click();
    await expect(page).toHaveURL(/\/?$/);
    await expect(page.getByText(/Entrar no Terminal/i)).toBeVisible();
  });

  test('volta de cadastro para login', async ({page}) => {
    await page.goto('/register');
    await page.locator('#register-goto-signin').click();
    await expect(page).toHaveURL(/\/?$/);
    await expect(page.getByText(/Entrar no Terminal/i)).toBeVisible();
  });

  test('valida email inválido em recuperar senha', async ({page}) => {
    await page.goto('/forgot-password');
    await page.locator('#forgot-password-email').fill('email-invalido');
    await page.locator('#forgot-password-submit').click();
    await expect(page.getByText(/Digite um email válido/i)).toBeVisible();
  });

  test('não avança no cadastro sem aceitar termos', async ({page}) => {
    await page.goto('/register');
    await page.locator('#register-firstname').fill('Pedro');
    await page.locator('#register-lastname').fill('Silva');
    await page.locator('#register-email').fill('pedro@example.com');
    await page.locator('#register-password').fill('Senha123!');
    await page.locator('#register-confirm-password').fill('Senha123!');
    await page.locator('#register-submit').click();
    await expect(page).toHaveURL(/register(?:\/)?$/);
    await expect(page.getByText(/Criar conta/i)).toBeVisible();
  });

  test('redefine senha com token inválido e abre solicitar novo link', async ({page}) => {
    await page.goto('/reset-password?token=token-invalido');
    await expect(page.locator('#reset-password-invalid')).toBeVisible();
    await expect(page.getByText(/Link inválido ou expirado/i)).toBeVisible();
    await page.getByRole('button', {name: /Solicitar novo link/i}).click();
    await expect(page).toHaveURL(/forgot-password(?:\/)?$/);
    await expect(page.getByText(/Esqueceu sua senha\?/i)).toBeVisible();
  });
});
