-- ======================================
-- SQL миграция для приложения Looking
-- Выполните этот скрипт в Supabase Dashboard -> SQL Editor
-- ======================================

-- Таблица профилей пользователей
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('client', 'stylist')) DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица стилистов с геолокацией
CREATE TABLE IF NOT EXISTS stylists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  bio TEXT,
  portfolio_images TEXT[],
  status TEXT CHECK (status IN ('available', 'busy', 'offline')) DEFAULT 'offline',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  current_mall TEXT,
  rating DECIMAL(3,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для быстрого поиска по статусу
CREATE INDEX IF NOT EXISTS idx_stylists_status ON stylists(status);

-- Индекс для поиска по user_id
CREATE INDEX IF NOT EXISTS idx_stylists_user_id ON stylists(user_id);

-- ======================================
-- Row Level Security (RLS) политики
-- ======================================

-- Включаем RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stylists ENABLE ROW LEVEL SECURITY;

-- Политики для profiles
-- Все могут видеть профили
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

-- Пользователи могут обновлять только свой профиль
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Пользователи могут вставлять свой профиль при регистрации
CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Политики для stylists
-- Все могут видеть стилистов
CREATE POLICY "Stylists are viewable by everyone" 
  ON stylists FOR SELECT 
  USING (true);

-- Только стилисты могут обновлять свои данные
CREATE POLICY "Stylists can update own data" 
  ON stylists FOR UPDATE 
  USING (auth.uid() = user_id);

-- Стилисты могут создавать свой профиль
CREATE POLICY "Stylists can insert own profile" 
  ON stylists FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ======================================
-- Функция для автоматического создания профиля при регистрации
-- ======================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Пользователь'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер на создание пользователя
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ======================================
-- Функция обновления updated_at
-- ======================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автообновления updated_at у стилистов
DROP TRIGGER IF EXISTS update_stylists_updated_at ON stylists;
CREATE TRIGGER update_stylists_updated_at
  BEFORE UPDATE ON stylists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ======================================
-- Тестовые данные (опционально)
-- ======================================

-- Раскомментируйте, если хотите добавить тестовых стилистов
/*
-- Вставка тестового пользователя-стилиста (замените UUID на реальный после регистрации)
INSERT INTO stylists (user_id, bio, status, latitude, longitude, current_mall, rating, portfolio_images)
VALUES (
  '00000000-0000-0000-0000-000000000000', -- Замените на реальный UUID
  'Профессиональный стилист с опытом работы 5+ лет. Специализируюсь на casual и business стилях.',
  'available',
  55.7558, -- Москва
  37.6173,
  'ТЦ Европейский',
  4.8,
  ARRAY['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg']
);
*/

-- ======================================
-- Готово! 
-- После выполнения этого скрипта ваша база данных готова к работе
-- ======================================

