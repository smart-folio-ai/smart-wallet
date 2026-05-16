import {expect, test} from '@playwright/test';

test.describe('Auth UI — Telas de Autenticação', () => {
  // ── Login ─────────────────────────────────────────────────────────────────
  test.describe('Login (/)', () => {
    test('renderiza o formulário de login com todos os elementos', async ({page}) => {
      await page.goto('/signin');

      await expect(page.getByRole('heading', {name: 'Entrar no Terminal'})).toBeVisible();
      await expect(page.locator('#signin-email')).toBeVisible();
      await expect(page.locator('#signin-password')).toBeVisible();
      await expect(page.locator('#signin-submit')).toBeVisible();
      await expect(page.getByText(/Esqueceu a senha?/i)).toBeVisible();
      await expect(page.getByText(/Criar conta/i)).toBeVisible();
    });

    test('exibe erro de validação para e-mail inválido', async ({page}) => {
      await page.goto('/signin');
      await page.locator('#signin-email').fill('emailinvalido');
      await page.locator('#signin-submit').click();
      await expect(page.getByText('Digite um email válido')).toBeVisible();
    });

    test('navega para recuperação de senha ao clicar no link', async ({page}) => {
      await page.goto('/signin');
      await page.locator('a[href="/forgot-password"]').click();
      await expect(page).toHaveURL(/forgot-password/);
      await expect(page.getByText('Esqueceu a senha?')).toBeVisible();
    });

    test('navega para criação de conta ao clicar em "Criar conta agora"', async ({page}) => {
      await page.goto('/signin');
      await page.locator('#signin-goto-register').click();
      await expect(page).toHaveURL(/register/);
      await expect(page.getByText('Criar conta', {exact: true})).toBeVisible();
    });

    test('alterna visibilidade da senha', async ({page}) => {
      await page.goto('/signin');
      const passwordInput = page.locator('#signin-password');
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Em botões apenas com ícone (SVG), buscamos pelo title/sr-only text ou clicamos no botão dentro da div
      await page.locator('button:has(svg.lucide-eye)').click();
      await expect(passwordInput).toHaveAttribute('type', 'text');

      await page.locator('button:has(svg.lucide-eye-off)').click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  // ── Register ──────────────────────────────────────────────────────────────
  test.describe('Cadastro (/register)', () => {
    test('renderiza o formulário de cadastro com todos os campos', async ({page}) => {
      await page.goto('/register');

      await expect(page.getByText('Criar conta', {exact: true})).toBeVisible();
      await expect(page.locator('#register-firstname')).toBeVisible();
      await expect(page.locator('#register-lastname')).toBeVisible();
      await expect(page.locator('#register-email')).toBeVisible();
      await expect(page.locator('#register-password')).toBeVisible();
      await expect(page.locator('#register-confirm-password')).toBeVisible();
      await expect(page.getByRole('checkbox')).toBeVisible();
      await expect(page.locator('#register-submit')).toBeVisible();
    });

    test('exibe erro quando as senhas não coincidem', async ({page}) => {
      await page.goto('/register');

      await page.locator('#register-firstname').fill('João');
      await page.locator('#register-lastname').fill('Silva');
      await page.locator('#register-email').fill('joao@email.com');
      await page.locator('#register-password').fill('senha12345');
      await page.locator('#register-confirm-password').fill('senha-outra');
      
      // Checar aceitação dos termos clickando na label ou no checkbox escondido
      await page.getByRole('checkbox').click({force: true});
      await page.locator('#register-submit').click();

      await expect(page.getByText('As senhas não correspondem')).toBeVisible();
    });

    test('exibe erro quando os termos não são aceitos', async ({page}) => {
      await page.goto('/register');

      await page.locator('#register-firstname').fill('João');
      await page.locator('#register-lastname').fill('Silva');
      await page.locator('#register-email').fill('joao@email.com');
      await page.locator('#register-password').fill('senha12345');
      await page.locator('#register-confirm-password').fill('senha12345');
      // Não clica no checkbox
      await page.locator('#register-submit').click();

      // Sem aceitar os termos, a validação do Zod barra (se tiver msg customizada) ou o HTML5 requires impede
      // Verificamos apenas se a URL não mudou, garantindo que o form não foi enviado
      await expect(page).toHaveURL(/\/register$/);
    });

    test('navega para login ao clicar em "Faça login"', async ({page}) => {
      await page.goto('/register');
      await page.locator('#register-goto-signin').click();
      await expect(page).toHaveURL('/signin');
    });
  });

  // ── Forgot Password ───────────────────────────────────────────────────────
  test.describe('Recuperação de Senha (/forgot-password)', () => {
    test('renderiza a tela de recuperação de senha', async ({page}) => {
      await page.goto('/forgot-password');

      await expect(page.getByText('Esqueceu a senha?', {exact: true})).toBeVisible();
      await expect(page.locator('#forgot-password-email')).toBeVisible();
      await expect(page.locator('#forgot-password-submit')).toBeVisible();
    });

    test('exibe erro de validação para e-mail inválido', async ({page}) => {
      await page.goto('/forgot-password');
      await page.locator('#forgot-password-email').fill('emailinvalido');
      await page.locator('#forgot-password-submit').click();
      await expect(page.getByText('Digite um email válido')).toBeVisible();
    });

    test('navega de volta ao login ao clicar em "Voltar para o login"', async ({page}) => {
      await page.goto('/forgot-password');
      await page.locator('#forgot-password-back').click();
      await expect(page).toHaveURL('/');
    });
  });

  // ── Reset Password ────────────────────────────────────────────────────────
  test.describe('Redefinição de Senha (/reset-password)', () => {
    test('exibe estado de link inválido quando sem token', async ({page}) => {
      await page.goto('/reset-password');

      await expect(page.locator('#reset-password-invalid')).toBeVisible();
      await expect(page.getByText(/Link inválido/i)).toBeVisible();
      await expect(page.locator('#reset-password-request-new')).toBeVisible();
    });

    test('redireciona para /forgot-password ao clicar em "Solicitar novo link"', async ({page}) => {
      await page.goto('/reset-password');
      await page.locator('#reset-password-request-new').click();
      await expect(page).toHaveURL(/forgot-password/);
    });
  });
});
