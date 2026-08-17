import {expect, test} from './helpers/base-test';

test.describe('Auth Navigation And Validation', () => {
  test('volta de recuperar senha para login', async ({page}) => {
    await page.goto('/forgot-password');
    await page.locator('#forgot-password-back').click();
    await expect(page).toHaveURL(/\/?$/);
    await expect(page.getByRole('link', {name: /Entrar/i}).first()).toBeVisible();
  });

  test('volta de cadastro para login', async ({page}) => {
    await page.goto('/register');
    await page.locator('#register-goto-signin').click();
    await expect(page).toHaveURL(/\/signin(?:\/)?$/);
    await expect(page.locator('#signin-submit')).toBeVisible();
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
    await expect(page.getByRole('heading', {name: /Criar conta/i})).toBeVisible();
  });

  test('redefine senha com token inválido e abre solicitar novo link', async ({page}) => {
    // Sem mock, essa validação bate no backend real por trás do proxy do
    // dev server — dependência de rede desnecessária que já flakou em CI.
    await page.route('**/auth/reset-password/token-invalido', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({message: 'Token inválido'}),
      });
    });

    await page.goto('/reset-password?token=token-invalido');
    await expect(page.locator('#reset-password-invalid')).toBeVisible();
    await expect(page.getByText(/Link inválido/i)).toBeVisible();
    await page.getByRole('button', {name: /Solicitar novo link/i}).click();
    await expect(page).toHaveURL(/forgot-password(?:\/)?$/);
    await expect(page.getByText(/Esqueceu a senha\?/i)).toBeVisible();
  });
});
