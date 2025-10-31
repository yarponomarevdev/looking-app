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

-- Удаляем старые политики для profiles (если существуют)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

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

-- Удаляем старые политики для stylists (если существуют)
DROP POLICY IF EXISTS "Stylists are viewable by everyone" ON stylists;
DROP POLICY IF EXISTS "Stylists can update own data" ON stylists;
DROP POLICY IF EXISTS "Stylists can insert own profile" ON stylists;

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
DECLARE
  user_role TEXT;
BEGIN
  -- Получаем роль из метаданных
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  
  -- Создаем профиль
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Пользователь'),
    user_role
  );
  
  -- Если роль стилист, автоматически создаем запись в таблице stylists
  IF user_role = 'stylist' THEN
    INSERT INTO public.stylists (user_id, bio, status, latitude, longitude, current_mall, rating)
    VALUES (
      NEW.id,
      'Новый стилист на платформе',
      'offline',  -- По умолчанию офлайн, стилист сам изменит статус
      55.7558,    -- Координаты центра Москвы по умолчанию
      37.6173,
      'Не указан',
      0.0         -- Начальный рейтинг
    );
  END IF;
  
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
-- Таблица бронирований
-- ======================================

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stylist_id UUID REFERENCES stylists(id) ON DELETE CASCADE NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  mall TEXT NOT NULL,
  comment TEXT,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'rejected', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для bookings
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_stylist_id ON bookings(stylist_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);

-- Триггер для автообновления updated_at у бронирований
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ======================================
-- Таблица уведомлений
-- ======================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('booking_created', 'booking_confirmed', 'booking_rejected')) NOT NULL,
  related_booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ======================================
-- RLS политики для bookings
-- ======================================

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики (если существуют)
DROP POLICY IF EXISTS "Clients can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Stylists can view bookings to them" ON bookings;
DROP POLICY IF EXISTS "Clients can create bookings" ON bookings;
DROP POLICY IF EXISTS "Clients can cancel own pending bookings" ON bookings;
DROP POLICY IF EXISTS "Stylists can update booking status" ON bookings;

-- Клиенты могут видеть свои бронирования
CREATE POLICY "Clients can view own bookings" 
  ON bookings FOR SELECT 
  USING (auth.uid() = client_id);

-- Стилисты могут видеть бронирования к ним
CREATE POLICY "Stylists can view bookings to them" 
  ON bookings FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT user_id FROM stylists WHERE id = stylist_id
    )
  );

-- Клиенты могут создавать бронирования
CREATE POLICY "Clients can create bookings" 
  ON bookings FOR INSERT 
  WITH CHECK (auth.uid() = client_id);

-- Клиенты могут отменять свои pending бронирования
CREATE POLICY "Clients can cancel own pending bookings" 
  ON bookings FOR UPDATE 
  USING (auth.uid() = client_id AND status = 'pending')
  WITH CHECK (status IN ('pending', 'rejected'));

-- Стилисты могут обновлять статус бронирований к ним
CREATE POLICY "Stylists can update booking status" 
  ON bookings FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT user_id FROM stylists WHERE id = stylist_id
    )
  )
  WITH CHECK (status IN ('confirmed', 'rejected', 'completed'));

-- ======================================
-- RLS политики для notifications
-- ======================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики (если существуют)
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Пользователи могут видеть только свои уведомления
CREATE POLICY "Users can view own notifications" 
  ON notifications FOR SELECT 
  USING (auth.uid() = user_id);

-- Система может создавать уведомления (через service role)
CREATE POLICY "System can create notifications" 
  ON notifications FOR INSERT 
  WITH CHECK (true);

-- Пользователи могут обновлять свои уведомления (отметить прочитанным)
CREATE POLICY "Users can update own notifications" 
  ON notifications FOR UPDATE 
  USING (auth.uid() = user_id);

-- ======================================
-- Функции для автоматического создания уведомлений
-- ======================================

-- Функция для создания уведомления при создании бронирования
CREATE OR REPLACE FUNCTION notify_booking_created()
RETURNS TRIGGER AS $$
DECLARE
  stylist_user_id UUID;
  client_name TEXT;
BEGIN
  -- Получаем user_id стилиста
  SELECT user_id INTO stylist_user_id 
  FROM stylists 
  WHERE id = NEW.stylist_id;
  
  -- Проверяем, что стилист найден
  IF stylist_user_id IS NULL THEN
    RAISE WARNING 'Stylist not found for booking %', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Получаем имя клиента с значением по умолчанию
  SELECT COALESCE(full_name, 'Клиент') INTO client_name 
  FROM profiles 
  WHERE id = NEW.client_id;
  
  -- Если профиль клиента не найден, используем значение по умолчанию
  client_name := COALESCE(client_name, 'Клиент');
  
  -- Создаем уведомление для стилиста
  INSERT INTO notifications (user_id, title, message, type, related_booking_id)
  VALUES (
    stylist_user_id,
    'Новый запрос на встречу',
    client_name || ' хочет записаться на ' || TO_CHAR(NEW.booking_date, 'DD.MM.YYYY') || ' в ' || TO_CHAR(NEW.booking_time, 'HH24:MI'),
    'booking_created',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для создания уведомления при подтверждении/отклонении бронирования
CREATE OR REPLACE FUNCTION notify_booking_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  stylist_name TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Только если статус изменился на confirmed или rejected
  IF NEW.status IN ('confirmed', 'rejected') AND OLD.status = 'pending' THEN
    -- Получаем имя стилиста с значением по умолчанию
    SELECT COALESCE(p.full_name, 'Стилист') INTO stylist_name
    FROM stylists s
    JOIN profiles p ON s.user_id = p.id
    WHERE s.id = NEW.stylist_id;
    
    -- Если стилист не найден, используем значение по умолчанию
    stylist_name := COALESCE(stylist_name, 'Стилист');
    
    -- Формируем текст уведомления
    IF NEW.status = 'confirmed' THEN
      notification_title := 'Бронирование подтверждено';
      notification_message := stylist_name || ' подтвердил встречу на ' || TO_CHAR(NEW.booking_date, 'DD.MM.YYYY') || ' в ' || TO_CHAR(NEW.booking_time, 'HH24:MI');
    ELSE
      notification_title := 'Бронирование отклонено';
      notification_message := stylist_name || ' не смог подтвердить встречу на ' || TO_CHAR(NEW.booking_date, 'DD.MM.YYYY');
    END IF;
    
    -- Создаем уведомление для клиента
    INSERT INTO notifications (user_id, title, message, type, related_booking_id)
    VALUES (
      NEW.client_id,
      notification_title,
      notification_message,
      CASE WHEN NEW.status = 'confirmed' THEN 'booking_confirmed' ELSE 'booking_rejected' END,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггеры для уведомлений
DROP TRIGGER IF EXISTS on_booking_created ON bookings;
CREATE TRIGGER on_booking_created
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_created();

DROP TRIGGER IF EXISTS on_booking_status_changed ON bookings;
CREATE TRIGGER on_booking_status_changed
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_status_changed();

-- ======================================
-- Готово! 
-- После выполнения этого скрипта ваша база данных готова к работе
-- ======================================

