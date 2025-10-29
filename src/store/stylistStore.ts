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
  subscribeToUpdates: () => () => void;
}

export const useStylistStore = create<StylistState>((set, get) => ({
  stylists: [],
  loading: false,
  error: null,
  
  fetchStylists: async () => {
    set({ loading: true, error: null });
    
    const { data, error } = await supabase
      .from('stylists')
      .select(`
        id, bio, status, latitude, longitude, current_mall, rating, portfolio_images,
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
      current_mall: item.current_mall,
      rating: item.rating,
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
        current_mall: data.current_mall,
        rating: data.rating,
        portfolio_images: data.portfolio_images || [],
      };
    }
    return null;
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

