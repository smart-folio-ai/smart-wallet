import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import type {ReactNode} from 'react';
import {PushNotificationToggle} from './PushNotificationToggle';
import {PushSubscriptionError} from '@/services/notifications/push';

/**
 * TRA-136 — estados do toggle de push.
 *
 * O serviço é mockado (já tem spec próprio); o que interessa aqui é que cada
 * estado do navegador produza um desfecho útil e que o componente nunca peça
 * permissão sozinho.
 */

const getSubscriptionState = vi.fn();
const subscribe = vi.fn();
const unsubscribe = vi.fn();

vi.mock('@/services/notifications/push', async () => {
  const actual = await vi.importActual<
    typeof import('@/services/notifications/push')
  >('@/services/notifications/push');

  return {
    ...actual,
    default: {
      getSubscriptionState: () => getSubscriptionState(),
      subscribe: () => subscribe(),
      unsubscribe: () => unsubscribe(),
    },
  };
});

function define(target: object, key: string, value: unknown) {
  Object.defineProperty(target, key, {
    value,
    configurable: true,
    writable: true,
  });
}

function installPushEnvironment() {
  define(window, 'isSecureContext', true);
  define(window, 'PushManager', class {});
  define(window, 'Notification', {permission: 'default'});
  define(navigator, 'serviceWorker', {register: vi.fn()});
}

function setUserAgent(userAgent: string, maxTouchPoints = 5) {
  define(navigator, 'userAgent', userAgent);
  define(navigator, 'maxTouchPoints', maxTouchPoints);
}

function wrapper({children}: {children: ReactNode}) {
  const queryClient = new QueryClient({
    defaultOptions: {queries: {retry: false}, mutations: {retry: false}},
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const originalUserAgent = navigator.userAgent;

beforeEach(() => {
  vi.clearAllMocks();
  installPushEnvironment();
  getSubscriptionState.mockResolvedValue({
    permission: 'default',
    subscribed: false,
  });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'PushManager');
  Reflect.deleteProperty(window, 'Notification');
  Reflect.deleteProperty(navigator, 'serviceWorker');
  define(navigator, 'userAgent', originalUserAgent);
  define(navigator, 'maxTouchPoints', 0);
});

function getSwitch() {
  return screen.getByRole('switch', {name: /notificações push/i});
}

describe('PushNotificationToggle — permissão "default"', () => {
  it('renderiza desligado, habilitado e sem pedir permissão sozinho', async () => {
    render(<PushNotificationToggle />, {wrapper});

    await waitFor(() => expect(getSwitch()).toBeEnabled());
    expect(getSwitch()).toHaveAttribute('aria-checked', 'false');
    expect(subscribe).not.toHaveBeenCalled();
  });

  it('assina só a partir do clique do usuário', async () => {
    subscribe.mockResolvedValue({permission: 'granted', subscribed: true});
    render(<PushNotificationToggle />, {wrapper});

    await waitFor(() => expect(getSwitch()).toBeEnabled());
    await userEvent.click(getSwitch());

    await waitFor(() => expect(subscribe).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(getSwitch()).toHaveAttribute('aria-checked', 'true'),
    );
  });

  it('mostra mensagem de erro quando a assinatura falha', async () => {
    subscribe.mockRejectedValue(
      new PushSubscriptionError('falhou', 'subscribe-failed'),
    );
    render(<PushNotificationToggle />, {wrapper});

    await waitFor(() => expect(getSwitch()).toBeEnabled());
    await userEvent.click(getSwitch());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /não foi possível ativar/i,
    );
  });
});

describe('PushNotificationToggle — permissão "granted"', () => {
  it('renderiza ligado quando já existe assinatura', async () => {
    getSubscriptionState.mockResolvedValue({
      permission: 'granted',
      subscribed: true,
    });
    render(<PushNotificationToggle />, {wrapper});

    await waitFor(() =>
      expect(getSwitch()).toHaveAttribute('aria-checked', 'true'),
    );
  });

  it('desligar cancela a assinatura', async () => {
    getSubscriptionState.mockResolvedValue({
      permission: 'granted',
      subscribed: true,
    });
    unsubscribe.mockResolvedValue({permission: 'granted', subscribed: false});
    render(<PushNotificationToggle />, {wrapper});

    await waitFor(() =>
      expect(getSwitch()).toHaveAttribute('aria-checked', 'true'),
    );
    await userEvent.click(getSwitch());

    await waitFor(() => expect(unsubscribe).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(getSwitch()).toHaveAttribute('aria-checked', 'false'),
    );
  });
});

describe('PushNotificationToggle — permissão "denied"', () => {
  it('desabilita o switch, explica como reativar e nunca re-pergunta', async () => {
    getSubscriptionState.mockResolvedValue({
      permission: 'denied',
      subscribed: false,
    });
    render(<PushNotificationToggle />, {wrapper});

    await waitFor(() => expect(getSwitch()).toBeDisabled());
    expect(screen.getByText(/estão bloqueadas para o Trackerr/i)).toBeVisible();

    await userEvent.click(getSwitch());
    expect(subscribe).not.toHaveBeenCalled();
  });
});

describe('PushNotificationToggle — ambiente sem suporte', () => {
  it('sem PushManager mostra indisponibilidade em vez de toggle vivo', async () => {
    Reflect.deleteProperty(window, 'PushManager');
    render(<PushNotificationToggle />, {wrapper});

    expect(getSwitch()).toBeDisabled();
    expect(
      screen.getByText(/não suporta notificações push/i),
    ).toBeInTheDocument();
    expect(getSubscriptionState).not.toHaveBeenCalled();
  });

  it('em contexto não seguro explica a exigência de HTTPS', async () => {
    define(window, 'isSecureContext', false);
    render(<PushNotificationToggle />, {wrapper});

    expect(screen.getByText(/conexão segura \(HTTPS\)/i)).toBeInTheDocument();
    expect(getSwitch()).toBeDisabled();
  });

  it('no Safari iOS fora da tela de início orienta a instalar o app', async () => {
    Reflect.deleteProperty(window, 'PushManager');
    setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
    );
    define(window, 'matchMedia', () => ({matches: false}));

    render(<PushNotificationToggle />, {wrapper});

    expect(screen.getByText(/Adicionar à Tela de Início/i)).toBeInTheDocument();
    expect(getSwitch()).toBeDisabled();
    expect(getSubscriptionState).not.toHaveBeenCalled();
  });
});
