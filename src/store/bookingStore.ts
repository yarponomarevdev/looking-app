/**
 * Store для управления бронированиями
 * Включает создание, получение, обновление бронирований и real-time подписку
 */

import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Booking, WorkSchedule } from '../types';

/**
 * Интерфейс для временного слота
 */
export interface TimeSlot {
  time: string; // Формат "HH:MM"
  available: boolean;
  status?: 'pending' | 'confirmed';
}

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
  getBookedSlots: (stylistId: string, date: string) => Promise<TimeSlot[]>;
  getAvailableSlots: (stylistId: string, date: string, workSchedule: WorkSchedule) => Promise<TimeSlot[]>;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  loading: false,
  error: null,
  
  createBooking: async (bookingData) => {
    set({ loading: true, error: null });
    
    try {
      // Проверяем доступность слота перед созданием
      const bookedSlots = await get().getBookedSlots(
        bookingData.stylist_id, 
        bookingData.booking_date
      );
      
      const isSlotTaken = bookedSlots.some(slot => slot.time === bookingData.booking_time);
      
      if (isSlotTaken) {
        set({ 
          error: 'Этот слот уже занят. Пожалуйста, выберите другое время.', 
          loading: false 
        });
        return null;
      }
      
      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          client_id: bookingData.client_id,
          stylist_id: bookingData.stylist_id,
          booking_date: bookingData.booking_date,
          booking_time: bookingData.booking_time,
          mall: bookingData.mall,
          comment: bookingData.comment,
          look_id: bookingData.look_id, // Добавляем ID образа, если указан
        }])
        .select(`
          *,
          stylist:stylists (
            id, bio, status, malls, brands,
            profiles:user_id (full_name, avatar_url)
          )
        `)
        .single();
      
      if (error) {
        // Обрабатываем ошибку constraint нарушения
        if (error.code === '23505') { // PostgreSQL unique constraint violation
          set({ 
            error: 'Этот слот был только что занят другим клиентом. Пожалуйста, выберите другое время.', 
            loading: false 
          });
        } else {
          set({ error: error.message, loading: false });
        }
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
          malls: data.stylist.malls || [],
          brands: data.stylist.brands || [],
          social_links: {},
          work_schedule: {},
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
          id, bio, status, malls, brands,
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
        malls: item.stylist.malls || [],
        brands: item.stylist.brands || [],
        social_links: {},
        work_schedule: {},
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
      .update({ status: 'cancelled' })
      .eq('id', bookingId);
    
    if (error) {
      set({ error: error.message });
      return false;
    }
    
    // Обновляем локальное состояние
    const bookings = get().bookings.map(b => 
      b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
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

  /**
   * Получает занятые слоты для стилиста на конкретную дату
   * @param stylistId - ID стилиста
   * @param date - Дата в формате YYYY-MM-DD
   * @returns Массив занятых временных слотов
   */
  getBookedSlots: async (stylistId: string, date: string): Promise<TimeSlot[]> => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('booking_time, status')
        .eq('stylist_id', stylistId)
        .eq('booking_date', date)
        .in('status', ['pending', 'confirmed'])
        .order('booking_time', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map(booking => ({
        time: booking.booking_time.slice(0, 5), // HH:MM
        available: false,
        status: booking.status as 'pending' | 'confirmed',
      }));
    } catch (error: any) {
      console.error('Error fetching booked slots:', error);
      return [];
    }
  },

  /**
   * Генерирует доступные слоты с учетом графика работы и занятости
   * @param stylistId - ID стилиста
   * @param date - Дата в формате YYYY-MM-DD
   * @param workSchedule - График работы стилиста
   * @returns Массив всех слотов (доступных и занятых)
   */
  getAvailableSlots: async (stylistId: string, date: string, workSchedule: WorkSchedule): Promise<TimeSlot[]> => {
    try {
      // Определяем день недели
      // Парсим дату вручную, чтобы избежать проблем с временными зонами
      const [year, month, day] = date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dateObj.getDay()] as keyof WorkSchedule;
      
      const daySchedule = workSchedule[dayName];
      
      // Если стилист не работает в этот день
      if (!daySchedule || !daySchedule.enabled) {
        return [];
      }
      
      // Проверяем, является ли выбранная дата сегодняшней
      const today = new Date();
      const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const selectedDateOnly = new Date(year, month - 1, day);
      const isToday = todayDateOnly.getTime() === selectedDateOnly.getTime();
      
      // Получаем занятые слоты
      const bookedSlots = await get().getBookedSlots(stylistId, date);
      const bookedTimes = new Set(bookedSlots.map(slot => slot.time));
      
      // Генерируем все возможные слоты с интервалом 30 минут
      const slots: TimeSlot[] = [];
      const [startHour, startMinute] = daySchedule.start.split(':').map(Number);
      const [endHour, endMinute] = daySchedule.end.split(':').map(Number);
      
      let currentHour = startHour;
      let currentMinute = startMinute;
      
      while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
        
        // Проверяем, занят ли слот
        const bookedSlot = bookedSlots.find(slot => slot.time === timeString);
        
        // Если это сегодняшний день, проверяем, не прошло ли уже это время
        let isAvailable = !bookedTimes.has(timeString);
        if (isToday && isAvailable) {
          const now = new Date();
          const [slotHour, slotMinute] = timeString.split(':').map(Number);
          const slotTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), slotHour, slotMinute);
          
          // Если время слота уже прошло, помечаем как недоступный
          if (slotTime <= now) {
            isAvailable = false;
          }
        }
        
        slots.push({
          time: timeString,
          available: isAvailable,
          status: bookedSlot?.status,
        });
        
        // Увеличиваем время на 30 минут
        currentMinute += 30;
        if (currentMinute >= 60) {
          currentMinute = 0;
          currentHour += 1;
        }
      }
      
      return slots;
    } catch (error: any) {
      console.error('Error generating available slots:', error);
      return [];
    }
  },
}));

