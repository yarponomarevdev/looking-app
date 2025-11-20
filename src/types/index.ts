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
  StylistDetail: { id: string; selectedLookId?: string }; // Добавлен опциональный selectedLookId для перехода с образом
  Bookings: undefined;
  StylistBookings: undefined;
  Notifications: undefined;
  EditStylistProfile: undefined;
  CreateLook: { profileBrands?: string[] }; // Экран создания образа
};

export type MainTabParamList = {
  Map: undefined;
  List: undefined;
  Feed: undefined; // Новая вкладка для ленты образов
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
  look_id?: string; // ID образа, на который записался клиент (опционально)
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  stylist?: Stylist;
  client?: Profile;
  look?: StylistLook; // Информация об образе (если бронирование привязано к образу)
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'booking_created' | 'booking_confirmed' | 'booking_rejected' | 'booking_cancelled';
  related_booking_id?: string;
  is_read: boolean;
  created_at: string;
}

// Интерфейс для образа стилиста
export interface StylistLook {
  id: string;
  stylist_id: string;
  title: string;
  description: string | null;
  image_url: string;
  brands: string[]; // Массив брендов одежды
  price: string | null; // Стоимость образа в свободном формате
  created_at: string;
  updated_at: string;
  stylist?: Stylist; // Информация о стилисте (для ленты)
  is_favorited?: boolean; // Добавлен ли в избранное текущим пользователем
}

// Интерфейс для избранного образа
export interface FavoriteLook {
  id: string;
  user_id: string;
  look_id: string;
  created_at: string;
}

