/**
 * Zustand-store для хранения текущей push-подписки пользователя
 * Используется несколькими компонентами и хуками для синхронизации состояния
 */

import { create } from 'zustand';
import { StoredPushSubscription } from '../types/push-subscription';

interface PushSubscriptionState {
  subscription: StoredPushSubscription | null;
  setSubscription: (subscription: StoredPushSubscription | null) => void;
  clearSubscription: () => void;
}

export const usePushSubscriptionStore = create<PushSubscriptionState>((set) => ({
  subscription: null,
  setSubscription: (subscription) => set({ subscription }),
  clearSubscription: () => set({ subscription: null }),
}));

