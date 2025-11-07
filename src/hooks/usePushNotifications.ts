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

  // Загрузка текущей подписки
  const loadSubscription = useCallback(async () => {
    if (Platform.OS !== 'web' || !userId) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      
      if (pushSubscription) {
        const subscriptionJSON = pushSubscription.toJSON();
        setSubscription({
          endpoint: subscriptionJSON.endpoint!,
          keys: {
            p256dh: subscriptionJSON.keys!.p256dh!,
            auth: subscriptionJSON.keys!.auth!,
          },
        });
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  }, [userId]);

  // Сохранение подписки в БД
  const saveSubscriptionToDatabase = async (sub: PushSubscription) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: sub.endpoint,
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,endpoint'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving subscription to database:', error);
      return false;
    }
  };

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
        registration = await registerServiceWorker();
        if (!registration) {
          setLoading(false);
          return false;
        }
      }

      // Получаем VAPID ключ из environment или используем временный
      // В production нужно заменить на ваш реальный VAPID ключ
      const applicationServerKey = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY || 
        'BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8xYqFj3jSUn7RdIuXCxOHRCwWMN3B6SIJ0BgqQ6LlLF82jJl5L2q5E';

      // Подписываемся на push-уведомления
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(applicationServerKey),
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
        setLoading(false);
        return true;
      }

      setLoading(false);
      return false;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      setLoading(false);
      return false;
    }
  }, [userId, permission, requestPermission, registerServiceWorker]);

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

  // Загружаем подписку при монтировании
  useEffect(() => {
    if (isSupported && userId) {
      registerServiceWorker();
      loadSubscription();
    }
  }, [isSupported, userId, registerServiceWorker, loadSubscription]);

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

// Утилита для конвертации VAPID ключа
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
  return outputArray;
}

// Проверка, является ли браузер Safari
function isSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return /^((?!chrome|android).)*safari/i.test(ua);
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

