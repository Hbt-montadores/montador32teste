// public/service-worker.js

self.addEventListener('install', event => {
  console.log('Service Worker instalado.');
});

self.addEventListener('activate', event => {
  console.log('Service Worker ativado.');
});

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
    icon: '/images/logo-192.png',
    badge: '/images/logo-192.png',
    data: {
      url: data.url || '/app'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  console.log('Notificação clicada:', event.notification);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;
      
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
