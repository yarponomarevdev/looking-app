/**
 * TypeScript типы для приложения Looking
 * Содержит интерфейсы для стилистов, профилей и навигации
 */

// Интерфейс для графика работы стилиста
export interface WorkSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  enabled: boolean;
  start: string; // Формат "HH:MM"
  end: string;   // Формат "HH:MM"
}

// Интерфейс для социальных сетей
export interface SocialLinks {
  instagram?: string;
  vk?: string;
  telegram?: string;
  whatsapp?: string;
}

export interface Stylist {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string;
  status: 'active' | 'inactive';
  latitude: number;
  longitude: number;
  malls: string[]; // Массив торговых центров
  brands: string[]; // Массив брендов одежды
  social_links: SocialLinks; // Социальные сети
  work_schedule: WorkSchedule; // График работы
  portfolio_images: string[];
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: 'client' | 'stylist';
  created_at: string;
}

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// Типы для навигации
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  StylistDetail: { id: string };
  Bookings: undefined;
  StylistBookings: undefined;
  Notifications: undefined;
  EditStylistProfile: undefined;
};

export type MainTabParamList = {
  Map: undefined;
  List: undefined;
  Profile: undefined;
};

export interface Booking {
  id: string;
  client_id: string;
  stylist_id: string;
  booking_date: string;
  booking_time: string;
  mall: string;
  comment?: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
  stylist?: Stylist;
  client?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'booking_created' | 'booking_confirmed' | 'booking_rejected';
  related_booking_id?: string;
  is_read: boolean;
  created_at: string;
}

