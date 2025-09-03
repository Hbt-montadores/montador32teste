--- START OF FILE public/service-worker.js ---
// public/service-worker.js

// Listener para o evento 'install' - útil para pré-cache de assets, mas não essencial para push.
self.addEventListener('install', event => {
  console.log('Service Worker instalado.');
  // Opcional: pré-cache de assets da aplicação
  // event.waitUntil(caches.open('v1').then(cache => {
  //   return cache.addAll(['/', '/app', '/style.css', '/script.js']);
  // }));
});

// Listener para o evento 'activate' - útil para limpar caches antigos.
self.addEventListener('activate', event => {
  console.log('Service Worker ativado.');
});

// Listener para o evento 'push' - aqui a mágica acontece.
self.addEventListener('push', event => {
  if (!event.data) {
    console.error('Push event, mas sem dados.');
    return;
  }
  
  const data = event.data.json();
  console.log('Push recebido:', data);

  const title = data.title || 'Montador de Sermões';
  const options = {
    body: data.body || 'Você tem uma nova mensagem!',
    icon: '/images/logo-192.png', // Ícone da notificação
    badge: '/images/logo-192.png', // Badge para Android (barra de status)
    data: {
      url: data.url || '/app' // URL para abrir ao clicar
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Listener para o evento 'notificationclick' - o que fazer quando o usuário clica.
self.addEventListener('notificationclick', event => {
  console.log('Notificação clicada:', event.notification);
  event.notification.close(); // Fecha a notificação

  // Tenta focar uma aba existente do app ou abre uma nova.
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      const urlToOpen = event.notification.data.url;
      // Se uma janela com a URL já estiver aberta, foca nela.
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não, abre uma nova janela.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

--- END OF FILE public/service-worker.js ---
