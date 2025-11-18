/**
 * Service Worker для PWA с поддержкой Push-уведомлений
 * Обрабатывает push-события и отображает уведомления
 */

// Динамическая версия кэша на основе даты сборки
const BUILD_DATE = new Date().toISOString().split('T')[0].replace(/-/g, '');
const CACHE_NAME = `looking-app-v${BUILD_DATE}`;
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing with cache:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Загружаем ресурсы с флагом 'reload', чтобы обойти HTTP-кэш браузера
        // и гарантированно получить свежие версии файлов с сервера
        const requestPromises = urlsToCache.map(url => {
          const request = new Request(url, { cache: 'reload' });
          return fetch(request)
            .then(response => {
              if (!response.ok) throw Error(`[SW] Failed to fetch ${url}`);
              return cache.put(request, response);
            });
        });
        return Promise.all(requestPromises);
      })
      .then(() => self.skipWaiting())
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating with cache:', CACHE_NAME);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Обработка fetch запросов - Network First для HTML, Cache First для остального
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Игнорируем все не-GET запросы (POST, PUT, DELETE и т.д. не кэшируются)
  if (request.method !== 'GET') {
    return;
  }

  // Не кэшируем запросы к API, Supabase и chrome-extension
  if (url.pathname.startsWith('/api') || 
      url.hostname.includes('supabase') ||
      url.pathname.includes('supabase') ||
      url.protocol === 'chrome-extension:') {
    return;
  }

  // Для HTML всегда идем в сеть сначала, чтобы получить свежие данные
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request, { cache: 'reload' }) // Игнорируем HTTP-кэш браузера
        .then((response) => {
          // Сохраняем в кэш только успешные ответы
          if (response && response.status === 200 && response.type === 'basic') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            }).catch(err => console.warn('[SW] Cache put failed:', err));
          }
          return response;
        })
        .catch(() => {
          // Если нет сети, пробуем кэш
          return caches.match(request);
        })
    );
    return;
  }

  // Для остальных ресурсов используем Cache First
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(request).then((response) => {
          // Кэшируем только успешные ответы для статических ресурсов
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            }).catch(err => console.warn('[SW] Cache put failed:', err));
          }
          return response;
        });
      })
  );
});

// Обработка Push-уведомлений
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let notificationData = {
    title: 'Looking',
    body: 'У вас новое уведомление',
    icon: '/icon.png',
    badge: '/favicon.png',
    tag: 'default',
    requireInteraction: false,
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.message || data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || data.type || notificationData.tag,
        data: data,
        requireInteraction: data.requireInteraction || false,
      };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: notificationData.requireInteraction,
      vibrate: [200, 100, 200],
    })
  );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  // Получаем данные из уведомления
  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Проверяем, есть ли уже открытое окно
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Если нет открытого окна, открываем новое
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Обработка закрытия уведомления
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});
