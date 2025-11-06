/**
 * Store для управления данными стилистов
 * Включает загрузку, поиск по ID и real-time обновления через Supabase
 */

import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Stylist } from '../types';

interface StylistState {
  stylists: Stylist[];
  loading: boolean;
  error: string | null;
  fetchStylists: () => Promise<void>;
  fetchStylistById: (id: string) => Promise<Stylist | null>;
  fetchStylistByUserId: (userId: string) => Promise<Stylist | null>;
  updateStylist: (userId: string, updates: Partial<Stylist>) => Promise<boolean>;
  updateStatus: (userId: string, status: 'available' | 'busy' | 'offline') => Promise<boolean>;
  subscribeToUpdates: () => () => void;
}

export const useStylistStore = create<StylistState>((set, get) => ({
  stylists: [],
  loading: false,
  error: null,
  
  fetchStylists: async () => {
    set({ loading: true, error: null });
    
    const { data, error} = await supabase
      .from('stylists')
      .select(`
        id, bio, status, latitude, longitude, malls, brands, social_links, work_schedule, portfolio_images,
        profiles:user_id (full_name, avatar_url)
      `)
      .in('status', ['available', 'busy']);
    
    if (error) {
      set({ error: error.message, loading: false });
      return;
    }
    
    const stylists: Stylist[] = data.map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      full_name: item.profiles?.full_name || 'Без имени',
      avatar_url: item.profiles?.avatar_url,
      bio: item.bio,
      status: item.status,
      latitude: item.latitude,
      longitude: item.longitude,
      malls: item.malls || [],
      brands: item.brands || [],
      social_links: item.social_links || {},
      work_schedule: item.work_schedule || {},
      portfolio_images: item.portfolio_images || [],
    }));
    
    set({ stylists, loading: false });
  },
  
  fetchStylistById: async (id: string) => {
    const existing = get().stylists.find(s => s.id === id);
    if (existing) return existing;
    
    const { data, error } = await supabase
      .from('stylists')
      .select(`*, profiles:user_id (full_name, avatar_url)`)
      .eq('id', id)
      .single();
    
    if (!error && data) {
      return {
        id: data.id,
        user_id: data.user_id,
        full_name: data.profiles?.full_name || 'Без имени',
        avatar_url: data.profiles?.avatar_url,
        bio: data.bio,
        status: data.status,
        latitude: data.latitude,
        longitude: data.longitude,
        malls: data.malls || [],
        brands: data.brands || [],
        social_links: data.social_links || {},
        work_schedule: data.work_schedule || {},
        portfolio_images: data.portfolio_images || [],
      };
    }
    return null;
  },

  fetchStylistByUserId: async (userId: string) => {
    // Сначала проверяем в кэше
    const existing = get().stylists.find(s => s.user_id === userId);
    if (existing) return existing;
    
    // Загружаем из БД по user_id
    const { data, error } = await supabase
      .from('stylists')
      .select(`*, profiles:user_id (full_name, avatar_url)`)
      .eq('user_id', userId)
      .single();
    
    if (!error && data) {
      return {
        id: data.id,
        user_id: data.user_id,
        full_name: data.profiles?.full_name || 'Без имени',
        avatar_url: data.profiles?.avatar_url,
        bio: data.bio,
        status: data.status,
        latitude: data.latitude,
        longitude: data.longitude,
        malls: data.malls || [],
        brands: data.brands || [],
        social_links: data.social_links || {},
        work_schedule: data.work_schedule || {},
        portfolio_images: data.portfolio_images || [],
      };
    }
    return null;
  },
  
  updateStylist: async (userId: string, updates: Partial<Stylist>) => {
    try {
      // Подготавливаем данные для обновления (убираем поля, которые не должны обновляться напрямую)
      const { id, user_id, full_name, avatar_url, ...updateData } = updates;
      
      const { error } = await supabase
        .from('stylists')
        .update(updateData)
        .eq('user_id', userId);
      
      if (error) {
        set({ error: error.message });
        return false;
      }
      
      // Обновляем локальное состояние
      await get().fetchStylists();
      return true;
    } catch (error: any) {
      set({ error: error.message });
      return false;
    }
  },

  updateStatus: async (userId: string, status: 'available' | 'busy' | 'offline') => {
    try {
      const { error } = await supabase
        .from('stylists')
        .update({ status })
        .eq('user_id', userId);
      
      if (error) {
        set({ error: error.message });
        return false;
      }
      
      // Обновляем локальное состояние
      const stylists = get().stylists.map(s =>
        s.user_id === userId ? { ...s, status } : s
      );
      set({ stylists });
      return true;
    } catch (error: any) {
      set({ error: error.message });
      return false;
    }
  },

  subscribeToUpdates: () => {
    const channel = supabase
      .channel('stylists-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'stylists' },
        () => get().fetchStylists()
      )
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  },
}));

