// public/service-worker.js - Versão Final com Cache de Ícones Corrigido

const CACHE_NAME = 'montador-de-sermoes-v1';
// Lista de arquivos essenciais para o funcionamento offline.
// CORREÇÃO: Adicionamos os caminhos exatos dos ícones aqui.
const assetsToCache = [
  '/',
  '/app',
  '/style.css',
  '/script.js',
  '/pwa-installer.js',
  '/manifest.json',
  '/images/logo-192.png', // Ícone usado para notificações e atalho
  '/images/logo-512.png'  // Ícone maior para a tela de splash
];

// Evento 'install': Salva os assets essenciais em cache.
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Colocando assets em cache');
        return cache.addAll(assetsToCache);
      })
  );
});

// Evento 'activate': Limpa caches antigos para manter a aplicação atualizada.
self.addEventListener('activate', event => {
  console.log('[Service Worker] Ativando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Limpando cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Evento 'fetch': Intercepta as requisições para permitir o funcionamento offline.
self.addEventListener('fetch', event => {
  event.respondWith(
    // Tenta encontrar a requisição no cache primeiro.
    caches.match(event.request)
      .then(response => {
        // Se encontrar no cache, retorna a resposta do cache.
        if (response) {
          return response;
        }
        // Se não encontrar, busca na rede.
        return fetch(event.request);
      })
  );
});


// --- Lógica de Notificações Push ---

self.addEventListener('push', event => {
  if (!event.data) {
    console.error('[Service Worker] Push event, mas sem dados.');
    return;
  }
  
  const data = event.data.json();
  const title = data.title || 'Montador de Sermões';
  const options = {
    body: data.body || 'Você tem uma nova mensagem!',
    icon: '/images/logo-192.png',  // Caminho para o ícone principal
    badge: '/images/logo-192.png', // Caminho para o ícone da barra de status (Android)
    data: {
      url: data.url || '/app'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
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
