/**
 * Типы данных для хранения push-подписок пользователя
 * Используется на клиенте и в Zustand-store
 */

export interface StoredPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

