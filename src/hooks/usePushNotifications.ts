/**
 * Хук для управления Push-уведомлениями в PWA
 * Обрабатывает подписку, отписку и проверку разрешений
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Утилита для конвертации VAPID ключа (должна быть объявлена до использования)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as Uint8Array;
}

// Проверка, является ли браузер Safari
function isSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  // Safari содержит "Safari" но НЕ содержит "Chrome" или "Chromium"
  // Chrome на Windows может содержать "Safari" в UA (из-за WebKit), но также содержит "Chrome"
  return /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|FxiOS/i.test(ua);
}

// Проверка, запущено ли приложение как PWA (standalone mode)
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    (window.matchMedia('(display-mode: standalone)').matches) ||
    ((window.navigator as any).standalone) ||
    document.referrer.includes('android-app://')
  );
}

export function usePushNotifications(userId?: string) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);

  // Проверка поддержки Push-уведомлений
  useEffect(() => {
    if (Platform.OS === 'web' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      // Для Safari: проверяем, установлено ли PWA
      if (isSafari() && !isStandalone()) {
        console.log('Safari: PWA должно быть установлено для push-уведомлений');
      }
    }
  }, []);

  // Регистрация Service Worker
  const registerServiceWorker = useCallback(async () => {
    if (Platform.OS !== 'web' || !('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }, []);

  // Загрузка текущей подписки и синхронизация с БД
  const loadSubscription = useCallback(async () => {
    if (Platform.OS !== 'web' || !userId) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // 1. Проверяем подписку в браузере
      const browserSubscription = await registration.pushManager.getSubscription();
      
      // 2. Проверяем подписку в БД
      const { data: dbSubscriptions, error: dbError } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', userId)
        .limit(1);

      if (dbError) {
        console.error('Error loading subscription from DB:', dbError);
      }

      const dbSubscription = dbSubscriptions && dbSubscriptions.length > 0 ? dbSubscriptions[0] : null;

      // 3. Синхронизация: если есть в БД, но нет в браузере - восстанавливаем
      if (dbSubscription && !browserSubscription) {
        const applicationServerKey = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;
        if (applicationServerKey) {
          try {
            const restoredSubscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(applicationServerKey) as any,
            });
            
            const restoredJSON = restoredSubscription.toJSON();
            // Обновляем endpoint в БД на новый (если изменился)
            await supabase
              .from('push_subscriptions')
              .update({ 
                endpoint: restoredJSON.endpoint!,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', userId)
              .eq('endpoint', dbSubscription.endpoint);
            
            setSubscription({
              endpoint: restoredJSON.endpoint!,
              keys: {
                p256dh: restoredJSON.keys!.p256dh!,
                auth: restoredJSON.keys!.auth!,
              },
            });
            console.log('✅ Push subscription restored from DB');
            return;
          } catch (error) {
            console.error('Error restoring subscription:', error);
          }
        }
      }

      // 4. Если есть в браузере - сохраняем в БД (если еще нет)
      if (browserSubscription && !dbSubscription) {
        const subscriptionJSON = browserSubscription.toJSON();
        const sub: PushSubscription = {
          endpoint: subscriptionJSON.endpoint!,
          keys: {
            p256dh: subscriptionJSON.keys!.p256dh!,
            auth: subscriptionJSON.keys!.auth!,
          },
        };
        // Сохраняем напрямую, без использования callback
        try {
          const { error: saveError } = await supabase
            .from('push_subscriptions')
            .upsert({
              user_id: userId,
              endpoint: sub.endpoint,
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,endpoint',
            });
          if (saveError) {
            console.error('Error syncing subscription to DB:', saveError);
          } else {
            console.log('✅ Push subscription synced to DB');
          }
        } catch (error) {
          console.error('Error syncing subscription:', error);
        }
        setSubscription(sub);
        return;
      }

      // 5. Если есть в обоих местах - используем браузерную версию
      if (browserSubscription) {
        const subscriptionJSON = browserSubscription.toJSON();
        setSubscription({
          endpoint: subscriptionJSON.endpoint!,
          keys: {
            p256dh: subscriptionJSON.keys!.p256dh!,
            auth: subscriptionJSON.keys!.auth!,
          },
        });
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  }, [userId]);

  // Сохранение подписки в БД
  const saveSubscriptionToDatabase = useCallback(async (sub: PushSubscription) => {
    if (!userId) {
      console.warn('Cannot save subscription: userId is missing');
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: sub.endpoint,
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,endpoint',
        })
        .select();

      if (error) {
        console.error('Error saving subscription to database:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      console.log('✅ Push subscription saved to DB:', data);
      return true;
    } catch (error) {
      console.error('Error saving subscription to database:', error);
      return false;
    }
  }, [userId]);

  // Удаление подписки из БД
  const removeSubscriptionFromDatabase = async (endpoint: string) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', endpoint);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing subscription from database:', error);
      return false;
    }
  };

  // Запрос разрешения на уведомления
  const requestPermission = useCallback(async () => {
    if (Platform.OS !== 'web' || !isSupported) {
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }, [isSupported]);

  // Подписка на Push-уведомления
  const subscribe = useCallback(async () => {
    if (Platform.OS !== 'web' || !userId) return false;

    setLoading(true);

    try {
      // Проверяем разрешение
      let currentPermission = permission;
      if (currentPermission === 'default') {
        currentPermission = await requestPermission();
      }

      if (currentPermission !== 'granted') {
        console.log('Notification permission not granted');
        setLoading(false);
        return false;
      }

      // Регистрируем Service Worker
      let registration = await navigator.serviceWorker.ready;
      if (!registration) {
        const newRegistration = await registerServiceWorker();
        if (!newRegistration) {
          setLoading(false);
          return false;
        }
        registration = newRegistration;
      }

      const applicationServerKey = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;
      if (!applicationServerKey) {
        console.error('VAPID public key is not configured');
        setLoading(false);
        return false;
      }

      // Подписываемся на push-уведомления
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(applicationServerKey) as any,
      });

      const subscriptionJSON = pushSubscription.toJSON();
      const sub: PushSubscription = {
        endpoint: subscriptionJSON.endpoint!,
        keys: {
          p256dh: subscriptionJSON.keys!.p256dh!,
          auth: subscriptionJSON.keys!.auth!,
        },
      };

      // Сохраняем в БД
      const saved = await saveSubscriptionToDatabase(sub);
      if (saved) {
        setSubscription(sub);
        console.log('✅ Push subscription created and saved');
        setLoading(false);
        return true;
      } else {
        // Если не удалось сохранить в БД, но подписка создана в браузере,
        // все равно показываем как включенную (пользователь видит toggle включен)
        console.warn('⚠️ Push subscription created in browser but failed to save to DB');
        setSubscription(sub);
        setLoading(false);
        return true; // Возвращаем true, чтобы toggle остался включенным
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      setLoading(false);
      return false;
    }
  }, [userId, permission, requestPermission, registerServiceWorker, saveSubscriptionToDatabase]);

  // Отписка от Push-уведомлений
  const unsubscribe = useCallback(async () => {
    if (Platform.OS !== 'web' || !userId) return false;

    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();

      if (pushSubscription) {
        await pushSubscription.unsubscribe();
        await removeSubscriptionFromDatabase(pushSubscription.endpoint);
        setSubscription(null);
      }

      setLoading(false);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      setLoading(false);
      return false;
    }
  }, [userId]);

  // Загружаем подписку при монтировании и при изменении userId
  useEffect(() => {
    if (isSupported && userId) {
      console.log('🔄 Loading push subscription for user:', userId);
      registerServiceWorker().then((registration) => {
        // Ждем регистрации SW перед загрузкой подписки
        if (registration) {
          loadSubscription();
        }
      });
    } else if (!userId) {
      console.log('⚠️ No userId, clearing subscription');
      setSubscription(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported, userId]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return undefined;
    }

    function handleServiceWorkerMessage(event: MessageEvent) {
      if (event.data?.type !== 'PUSH_SUBSCRIPTION_CHANGED') {
        return;
      }
      const incoming = event.data.subscription as PushSubscription | undefined;
      if (!incoming) {
        return;
      }

      saveSubscriptionToDatabase(incoming).then((saved) => {
        if (saved) {
          setSubscription(incoming);
        }
      });
    }

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [saveSubscriptionToDatabase]);

  return {
    isSupported,
    permission,
    subscription,
    loading,
    subscribe,
    unsubscribe,
    requestPermission,
  };
}

