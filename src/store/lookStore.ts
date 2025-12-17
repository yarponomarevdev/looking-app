/**
 * Store для управления образами стилистов и избранным
 * Включает загрузку образов, создание, обновление, удаление и управление избранным
 */

import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { StylistLook } from '../types';

interface LookState {
  looks: StylistLook[];
  favoriteLookIds: Set<string>; // Множество ID избранных образов для быстрой проверки
  loading: boolean;
  error: string | null;
  
  // Загрузка всех образов для ленты
  fetchLooks: () => Promise<void>;
  
  // Загрузка образов конкретного стилиста
  fetchStylistLooks: (stylistId: string) => Promise<StylistLook[]>;
  
  // Создание нового образа
  createLook: (stylistId: string, title: string, description: string, imageUrl: string, brands: string[], price: string | null) => Promise<boolean>;
  
  // Обновление образа
  updateLook: (lookId: string, title: string, description: string) => Promise<boolean>;
  
  // Удаление образа
  deleteLook: (lookId: string) => Promise<boolean>;
  
  // Загрузка избранных образов пользователя
  fetchFavorites: (userId: string) => Promise<void>;
  
  // Добавить образ в избранное
  addToFavorites: (userId: string, lookId: string) => Promise<boolean>;
  
  // Удалить образ из избранного
  removeFromFavorites: (userId: string, lookId: string) => Promise<boolean>;
  
  // Проверка, добавлен ли образ в избранное
  isFavorited: (lookId: string) => boolean;
}

export const useLookStore = create<LookState>((set, get) => ({
  looks: [],
  favoriteLookIds: new Set(),
  loading: false,
  error: null,
  
  fetchLooks: async () => {
    set({ loading: true, error: null });
    
    try {
      // Загружаем все образы с информацией о стилистах
      const { data, error } = await supabase
        .from('stylist_looks')
        .select(`
          id, title, description, image_url, brands, price, created_at, updated_at,
          stylist_id,
          stylists:stylist_id (
            id, user_id, bio, status, latitude, longitude, malls, brands, social_links, work_schedule, portfolio_images,
            profiles:user_id (full_name, avatar_url)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }
      
      // Преобразуем данные в нужный формат и фильтруем только активных стилистов
      const looks: StylistLook[] = (data || [])
        .map((item: any) => {
          const stylistData = item.stylists;
          return {
            id: item.id,
            stylist_id: item.stylist_id,
            title: item.title,
            description: item.description,
            image_url: item.image_url,
            brands: item.brands || [],
            price: item.price ?? null,
            created_at: item.created_at,
            updated_at: item.updated_at,
            stylist: stylistData ? {
              id: stylistData.id,
              user_id: stylistData.user_id,
              full_name: stylistData.profiles?.full_name || 'Без имени',
              avatar_url: stylistData.profiles?.avatar_url,
              bio: stylistData.bio,
              status: stylistData.status,
              latitude: stylistData.latitude,
              longitude: stylistData.longitude,
              malls: stylistData.malls || [],
              brands: stylistData.brands || [],
              social_links: stylistData.social_links || {},
              work_schedule: stylistData.work_schedule || {},
              portfolio_images: stylistData.portfolio_images || [],
            } : undefined,
          };
        })
        // Фильтруем образы: показываем только от активных стилистов
        .filter(look => look.stylist && look.stylist.status === 'active');
      
      set({ looks, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  fetchStylistLooks: async (stylistId: string) => {
    try {
      const { data, error } = await supabase
        .from('stylist_looks')
        .select('*')
        .eq('stylist_id', stylistId)
        .order('created_at', { ascending: false });
      
      if (error) {
        set({ error: error.message });
        return [];
      }
      
      return data || [];
    } catch (error: any) {
      set({ error: error.message });
      return [];
    }
  },
  
  createLook: async (stylistId: string, title: string, description: string, imageUrl: string, brands: string[], price: string | null) => {
    try {
      const preparedPrice = price?.trim() || null;
      const { error } = await supabase
        .from('stylist_looks')
        .insert({
          stylist_id: stylistId,
          title,
          description,
          image_url: imageUrl,
          brands: brands || [],
          price: preparedPrice,
        });
      
      if (error) {
        set({ error: error.message });
        return false;
      }
      
      // Перезагружаем образы после создания
      await get().fetchLooks();
      return true;
    } catch (error: any) {
      set({ error: error.message });
      return false;
    }
  },
  
  updateLook: async (lookId: string, title: string, description: string) => {
    try {
      const { error } = await supabase
        .from('stylist_looks')
        .update({ title, description })
        .eq('id', lookId);
      
      if (error) {
        set({ error: error.message });
        return false;
      }
      
      // Обновляем локальное состояние
      const looks = get().looks.map(look =>
        look.id === lookId ? { ...look, title, description } : look
      );
      set({ looks });
      return true;
    } catch (error: any) {
      set({ error: error.message });
      return false;
    }
  },
  
  deleteLook: async (lookId: string) => {
    try {
      const { error } = await supabase
        .from('stylist_looks')
        .delete()
        .eq('id', lookId);
      
      if (error) {
        set({ error: error.message });
        return false;
      }
      
      // Удаляем из локального состояния
      const looks = get().looks.filter(look => look.id !== lookId);
      set({ looks });
      return true;
    } catch (error: any) {
      set({ error: error.message });
      return false;
    }
  },
  
  fetchFavorites: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('favorite_looks')
        .select('look_id')
        .eq('user_id', userId);
      
      if (error) {
        set({ error: error.message });
        return;
      }
      
      // Сохраняем ID избранных образов в Set для быстрой проверки
      const favoriteLookIds = new Set(data?.map(item => item.look_id) || []);
      set({ favoriteLookIds });
    } catch (error: any) {
      set({ error: error.message });
    }
  },
  
  addToFavorites: async (userId: string, lookId: string) => {
    console.log('[lookStore] Adding to favorites, userId:', userId, 'lookId:', lookId);
    
    // Оптимистичное обновление
    const originalFavorites = new Set(get().favoriteLookIds);
    const newFavorites = new Set(originalFavorites);
    newFavorites.add(lookId);
    set({ favoriteLookIds: newFavorites });

    try {
      const { error } = await supabase
        .from('favorite_looks')
        .insert({ user_id: userId, look_id: lookId });
      
      if (error) {
        console.error('[lookStore] Add to favorites error:', error);
        // Откат в случае ошибки
        set({ favoriteLookIds: originalFavorites, error: error.message });
        return false;
      }
      
      console.log('[lookStore] Successfully added to favorites');
      return true;
    } catch (error: any) {
      console.error('[lookStore] Add to favorites exception:', error);
      // Откат в случае ошибки
      set({ favoriteLookIds: originalFavorites, error: error.message });
      return false;
    }
  },
  
  removeFromFavorites: async (userId: string, lookId: string) => {
    console.log('[lookStore] Removing from favorites, userId:', userId, 'lookId:', lookId);
    
    // Оптимистичное обновление
    const originalFavorites = new Set(get().favoriteLookIds);
    const newFavorites = new Set(originalFavorites);
    newFavorites.delete(lookId);
    set({ favoriteLookIds: newFavorites });

    try {
      const { error } = await supabase
        .from('favorite_looks')
        .delete()
        .eq('user_id', userId)
        .eq('look_id', lookId);
      
      if (error) {
        console.error('[lookStore] Remove from favorites error:', error);
        // Откат в случае ошибки
        set({ favoriteLookIds: originalFavorites, error: error.message });
        return false;
      }
      
      console.log('[lookStore] Successfully removed from favorites');
      return true;
    } catch (error: any) {
      console.error('[lookStore] Remove from favorites exception:', error);
      // Откат в случае ошибки
      set({ favoriteLookIds: originalFavorites, error: error.message });
      return false;
    }
  },
  
  isFavorited: (lookId: string) => {
    return get().favoriteLookIds.has(lookId);
  },
}));

