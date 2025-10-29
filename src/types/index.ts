/**
 * TypeScript типы для приложения Looking
 * Содержит интерфейсы для стилистов, профилей и навигации
 */

export interface Stylist {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string;
  status: 'available' | 'busy' | 'offline';
  latitude: number;
  longitude: number;
  current_mall: string;
  rating: number;
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
};

export type MainTabParamList = {
  Map: undefined;
  List: undefined;
  Profile: undefined;
};

