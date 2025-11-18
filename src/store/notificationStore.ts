/**
 * Store для управления уведомлениями
 * Включает получение, отметку прочитанных и real-time подписки
 */

import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Notification } from '../types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: (userId: string) => Promise<boolean>;
  subscribeToNotifications: (userId: string) => () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  
  fetchNotifications: async (userId: string) => {
    set({ loading: true, error: null });
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      set({ error: error.message, loading: false });
      return;
    }
    
    const notifications: Notification[] = data || [];
    const unreadCount = notifications.filter(n => !n.is_read).length;
    
    set({ notifications, unreadCount, loading: false });
  },
  
  markAsRead: async (notificationId: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select();
    
    if (error) {
      set({ error: error.message });
      return false;
    }

    // Если запись не обновилась (например, из-за RLS или неверного ID), возвращаем false
    // и не обновляем локальное состояние, чтобы пользователь видел проблему
    if (!data || data.length === 0) {
      console.warn('Notification update failed: No rows affected. Check RLS policies.');
      return false;
    }
    
    // Обновляем локальное состояние
    const notifications = get().notifications.map(n => 
      n.id === notificationId ? { ...n, is_read: true } : n
    );
    const unreadCount = notifications.filter(n => !n.is_read).length;
    
    set({ notifications, unreadCount });
    return true;
  },
  
  markAllAsRead: async (userId: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select();
    
    if (error) {
      set({ error: error.message });
      return false;
    }

    // Если ничего не обновилось, но ошибок нет - возможно все уже прочитано
    // или RLS блокирует обновление
    if ((!data || data.length === 0) && error) {
        return false;
    }
    
    // Обновляем локальное состояние
    const notifications = get().notifications.map(n => ({ ...n, is_read: true }));
    
    set({ notifications, unreadCount: 0 });
    return true;
  },
  
  subscribeToNotifications: (userId: string) => {
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        () => {
          // Перезагружаем уведомления при изменениях
          get().fetchNotifications(userId);
        }
      )
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  },
  
  reset: () => {
    set({ 
      notifications: [], 
      unreadCount: 0, 
      loading: false, 
      error: null 
    });
  },
}));

