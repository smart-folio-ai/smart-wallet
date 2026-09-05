/*
 * Trackerr — service worker mínimo (TRA-136, Web Push).
 *
 * Escopo deliberadamente pequeno: este arquivo existe SÓ porque a Push API
 * exige um service worker. Não há cache, precache nem estratégia offline —
 * o app continua sendo uma SPA normal servida pela rede. Não adicione
 * Workbox/vite-plugin-pwa aqui sem uma tarefa específica para isso.
 *
 * Fica em `public/` (copiado como está para a raiz do build) para que o
 * escopo `/` cubra o app inteiro. Não passa pelo bundler: nada de import.
 */

const DEFAULT_TITLE = 'Trackerr';
const DEFAULT_ICON = '/apple-touch-icon.png';
const DEFAULT_BADGE = '/favicon-32x32.png';
const DEFAULT_ROUTE = '/';

// Assume o controle assim que instalado: sem isso, a primeira assinatura só
// passaria a receber push depois que todas as abas antigas fossem fechadas.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/**
 * O payload é enviado pelo backend. Toleramos JSON plano, JSON com os campos
 * dentro de `data`/`action` e texto puro — um payload inesperado nunca pode
 * derrubar o handler, senão o navegador mostra a notificação genérica
 * "Este site foi atualizado em segundo plano".
 */
function readPayload(event) {
  if (!event.data) return {};

  try {
    const parsed = event.data.json();
    if (parsed && typeof parsed === 'object') return parsed;
  } catch (error) {
    // não era JSON — cai no texto puro abaixo
  }

  try {
    return {body: event.data.text()};
  } catch (error) {
    return {};
  }
}

function readRoute(payload) {
  const candidates = [
    payload.route,
    payload.data && payload.data.route,
    payload.action && payload.action.route,
  ];
  const route = candidates.find((value) => typeof value === 'string' && value);
  return route || DEFAULT_ROUTE;
}

self.addEventListener('push', (event) => {
  const payload = readPayload(event);
  const title = typeof payload.title === 'string' && payload.title
    ? payload.title
    : DEFAULT_TITLE;

  const options = {
    body: typeof payload.body === 'string' ? payload.body : '',
    icon: typeof payload.icon === 'string' ? payload.icon : DEFAULT_ICON,
    badge: typeof payload.badge === 'string' ? payload.badge : DEFAULT_BADGE,
    data: {route: readRoute(payload)},
  };

  if (typeof payload.tag === 'string' && payload.tag) {
    options.tag = payload.tag;
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const target = new URL(
    typeof data.route === 'string' && data.route ? data.route : DEFAULT_ROUTE,
    self.location.origin,
  );

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // Reaproveita uma aba já aberta do app — abrir uma nova a cada clique
      // deixa o usuário com meia dúzia de abas do Trackerr.
      for (const client of clientList) {
        if (new URL(client.url).origin !== target.origin) continue;

        await client.focus();

        if (client.url !== target.href && typeof client.navigate === 'function') {
          try {
            await client.navigate(target.href);
          } catch (error) {
            // navigate() falha em alguns navegadores/contextos; a aba já
            // recebeu foco, então é degradação aceitável.
          }
        }

        return;
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(target.href);
      }
    })(),
  );
});
