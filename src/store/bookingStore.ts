/**
 * Store для управления бронированиями
 * Включает создание, получение, обновление бронирований и real-time подписки
 */

import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Booking } from '../types';

interface BookingState {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  createBooking: (booking: Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'status'>) => Promise<Booking | null>;
  fetchMyBookings: (clientId: string) => Promise<void>;
  fetchStylistBookings: (stylistId: string) => Promise<void>;
  updateBookingStatus: (bookingId: string, status: 'confirmed' | 'rejected' | 'completed') => Promise<boolean>;
  cancelBooking: (bookingId: string) => Promise<boolean>;
  subscribeToBookings: (userId: string, isStylist: boolean) => () => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  loading: false,
  error: null,
  
  createBooking: async (bookingData) => {
    set({ loading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          client_id: bookingData.client_id,
          stylist_id: bookingData.stylist_id,
          booking_date: bookingData.booking_date,
          booking_time: bookingData.booking_time,
          mall: bookingData.mall,
          comment: bookingData.comment,
        }])
        .select(`
          *,
          stylist:stylists (
            id, bio, status, current_mall, rating,
            profiles:user_id (full_name, avatar_url)
          )
        `)
        .single();
      
      if (error) {
        set({ error: error.message, loading: false });
        return null;
      }
      
      // Форматируем данные стилиста
      const booking: Booking = {
        ...data,
        stylist: data.stylist ? {
          id: data.stylist.id,
          user_id: data.stylist.profiles?.id,
          full_name: data.stylist.profiles?.full_name || 'Без имени',
          avatar_url: data.stylist.profiles?.avatar_url,
          bio: data.stylist.bio,
          status: data.stylist.status,
          latitude: 0,
          longitude: 0,
          current_mall: data.stylist.current_mall,
          rating: data.stylist.rating,
          portfolio_images: [],
        } : undefined,
      };
      
      set({ loading: false });
      return booking;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },
  
  fetchMyBookings: async (clientId: string) => {
    set({ loading: true, error: null });
    
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        stylist:stylists (
          id, bio, status, current_mall, rating,
          profiles:user_id (full_name, avatar_url)
        )
      `)
      .eq('client_id', clientId)
      .order('booking_date', { ascending: false });
    
    if (error) {
      set({ error: error.message, loading: false });
      return;
    }
    
    const bookings: Booking[] = data.map((item: any) => ({
      ...item,
      stylist: item.stylist ? {
        id: item.stylist.id,
        user_id: item.stylist.profiles?.id,
        full_name: item.stylist.profiles?.full_name || 'Без имени',
        avatar_url: item.stylist.profiles?.avatar_url,
        bio: item.stylist.bio,
        status: item.stylist.status,
        latitude: 0,
        longitude: 0,
        current_mall: item.stylist.current_mall,
        rating: item.stylist.rating,
        portfolio_images: [],
      } : undefined,
    }));
    
    set({ bookings, loading: false });
  },
  
  fetchStylistBookings: async (stylistId: string) => {
    set({ loading: true, error: null });
    
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        client:profiles!client_id (full_name, avatar_url, email)
      `)
      .eq('stylist_id', stylistId)
      .order('booking_date', { ascending: true });
    
    if (error) {
      set({ error: error.message, loading: false });
      return;
    }
    
    const bookings: Booking[] = data.map((item: any) => ({
      ...item,
      client: item.client ? {
        id: item.client_id,
        email: item.client.email,
        full_name: item.client.full_name,
        avatar_url: item.client.avatar_url,
        role: 'client' as const,
        created_at: '',
      } : undefined,
    }));
    
    set({ bookings, loading: false });
  },
  
  updateBookingStatus: async (bookingId: string, status: 'confirmed' | 'rejected' | 'completed') => {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);
    
    if (error) {
      set({ error: error.message });
      return false;
    }
    
    // Обновляем локальное состояние
    const bookings = get().bookings.map(b => 
      b.id === bookingId ? { ...b, status } : b
    );
    set({ bookings });
    
    return true;
  },
  
  cancelBooking: async (bookingId: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'rejected' })
      .eq('id', bookingId);
    
    if (error) {
      set({ error: error.message });
      return false;
    }
    
    // Обновляем локальное состояние
    const bookings = get().bookings.map(b => 
      b.id === bookingId ? { ...b, status: 'rejected' as const } : b
    );
    set({ bookings });
    
    return true;
  },
  
  subscribeToBookings: (userId: string, isStylist: boolean) => {
    const channel = supabase
      .channel('bookings-realtime')
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'bookings',
          filter: isStylist 
            ? `stylist_id=eq.${userId}` 
            : `client_id=eq.${userId}`
        },
        () => {
          // Перезагружаем бронирования при изменениях
          if (isStylist) {
            get().fetchStylistBookings(userId);
          } else {
            get().fetchMyBookings(userId);
          }
        }
      )
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  },
}));

