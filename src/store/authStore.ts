/**
 * Store для управления аутентификацией
 * Использует Zustand для state management и Supabase для auth
 */

import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { useNotificationStore } from './notificationStore';
import { useStylistStore } from './stylistStore';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: 'client' | 'stylist') => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

// Храним subscription вне store для управления жизненным циклом
let authSubscription: { unsubscribe: () => void } | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,
  
  initialize: async () => {
    // Удаляем старую подписку, если она существует
    if (authSubscription) {
      authSubscription.unsubscribe();
      authSubscription = null;
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    console.log('[Auth] Initialize:', session?.user?.email || 'no user');
    set({ session, user: session?.user ?? null, loading: false });
    
    // Сохраняем новую подписку
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[Auth] State changed:', _event, session?.user?.email || 'no user');
      set({ session, user: session?.user ?? null });
    });
    authSubscription = subscription;
  },
  
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('[Auth] Sign in error:', error);
      throw error;
    }
    
    // Сразу обновляем состояние после успешного входа
    // Это предотвращает белый экран перед срабатыванием onAuthStateChange
    if (data.session) {
      console.log('[Auth] Sign in successful:', data.session.user?.email);
      set({ 
        session: data.session, 
        user: data.session.user 
      });
    }
  },
  
  signUp: async (email, password, role) => {
    // Определяем redirect URL в зависимости от платформы
    const redirectTo = Platform.OS === 'web' 
      ? process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL || 'https://looking-web.vercel.app'
      : process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL_MOBILE || 'lookingapp://auth/callback';
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { role },
        emailRedirectTo: redirectTo
      }
    });
    if (error) throw error;
  },
  
  signOut: async () => {
    try {
      console.log('[Auth] Signing out...');
      // Выполняем выход
      await supabase.auth.signOut();
      
      // Очищаем локальное состояние
      set({ session: null, user: null });
      
      // Очищаем состояние уведомлений и стилистов
      useNotificationStore.getState().reset();
      useStylistStore.getState().reset();
      console.log('[Auth] Sign out successful');
    } catch (error) {
      console.error('[Auth] Error during sign out:', error);
      // Всё равно пытаемся выйти даже при ошибках
      await supabase.auth.signOut();
      set({ session: null, user: null });
      useNotificationStore.getState().reset();
      useStylistStore.getState().reset();
    }
  },
}));

