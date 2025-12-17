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

-- Таблица стилистов с геолокацией и расширенным профилем
CREATE TABLE IF NOT EXISTS stylists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  bio TEXT,
  portfolio_images TEXT[],
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'inactive',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  malls TEXT[], -- Массив торговых центров, в которых работает стилист
  brands TEXT[], -- Массив брендов одежды (тэги)
  social_links JSONB, -- Социальные сети: {"instagram": "username", "vk": "url", "telegram": "@username"}
  work_schedule JSONB, -- График работы: {"monday": {"start": "10:00", "end": "20:00", "enabled": true}, ...}
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
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
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
    INSERT INTO public.stylists (user_id, bio, status, latitude, longitude, malls, brands, social_links, work_schedule)
    VALUES (
      NEW.id,
      '',
      'inactive',  -- По умолчанию не активен, пока не пройдет модерацию
      55.7558,      -- Координаты центра Москвы по умолчанию
      37.6173,
      ARRAY[]::TEXT[], -- Пустой массив ТЦ (заполнит стилист)
      ARRAY[]::TEXT[], -- Пустой массив брендов (заполнит стилист)
      '{}'::JSONB,     -- Пустой объект соцсетей (заполнит стилист)
      jsonb_build_object(
        'monday', jsonb_build_object('enabled', true, 'start', '10:00', 'end', '20:00'),
        'tuesday', jsonb_build_object('enabled', true, 'start', '10:00', 'end', '20:00'),
        'wednesday', jsonb_build_object('enabled', true, 'start', '10:00', 'end', '20:00'),
        'thursday', jsonb_build_object('enabled', true, 'start', '10:00', 'end', '20:00'),
        'friday', jsonb_build_object('enabled', true, 'start', '10:00', 'end', '20:00'),
        'saturday', jsonb_build_object('enabled', true, 'start', '11:00', 'end', '19:00'),
        'sunday', jsonb_build_object('enabled', false, 'start', '10:00', 'end', '20:00')
      )  -- Дефолтный график работы
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Логируем ошибку для отладки
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  -- Возвращаем NEW, чтобы не блокировать создание пользователя
  RETURN NEW;
END;
$$;

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
INSERT INTO stylists (user_id, bio, status, latitude, longitude, malls, brands, social_links, work_schedule, portfolio_images)
VALUES (
  '00000000-0000-0000-0000-000000000000', -- Замените на реальный UUID
  'Профессиональный стилист с опытом работы 5+ лет. Специализируюсь на casual и business стилях.',
  'active',
  55.7558, -- Москва
  37.6173,
  ARRAY['ТЦ Европейский', 'ТЦ Афимолл', 'ТЦ Атриум'], -- Массив ТЦ
  ARRAY['Zara', 'H&M', 'Massimo Dutti', 'COS'], -- Бренды
  '{"instagram": "stylist_name", "telegram": "@stylist_name"}'::JSONB, -- Соцсети
  jsonb_build_object(
    'monday', jsonb_build_object('enabled', true, 'start', '10:00', 'end', '20:00'),
    'tuesday', jsonb_build_object('enabled', true, 'start', '10:00', 'end', '20:00'),
    'wednesday', jsonb_build_object('enabled', true, 'start', '10:00', 'end', '20:00'),
    'thursday', jsonb_build_object('enabled', true, 'start', '10:00', 'end', '20:00'),
    'friday', jsonb_build_object('enabled', true, 'start', '10:00', 'end', '20:00'),
    'saturday', jsonb_build_object('enabled', true, 'start', '11:00', 'end', '19:00'),
    'sunday', jsonb_build_object('enabled', false, 'start', '10:00', 'end', '20:00')
  ),
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
  type TEXT CHECK (type IN ('booking_created', 'booking_confirmed', 'booking_rejected', 'booking_cancelled')) NOT NULL,
  related_booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ======================================
-- Таблица push-подписок (PWA)
-- ======================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can create own subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON push_subscriptions;

CREATE POLICY "Users can view own subscriptions"
  ON push_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscriptions"
  ON push_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON push_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON push_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();

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
-- Автоотправка push-уведомлений (pg_net + Edge Function)
-- ======================================

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION send_push_notification_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  notification_url TEXT;
  service_role_key TEXT;
BEGIN
  notification_url := CASE
    WHEN NEW.related_booking_id IS NOT NULL THEN '/bookings'
    WHEN NEW.type IN ('booking_created', 'booking_confirmed', 'booking_rejected', 'booking_cancelled') THEN '/bookings'
    ELSE '/notifications'
  END;

  service_role_key := COALESCE(
    current_setting('app.settings.service_role_key', true),
    'YOUR_SERVICE_ROLE_KEY'
  );

  IF service_role_key IS NULL OR service_role_key = '' OR service_role_key = 'YOUR_SERVICE_ROLE_KEY' THEN
    RAISE WARNING 'Service role key not configured. Skipping push notification.';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://bblovvqoltasbbwzrjlb.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key,
      'apikey', service_role_key
    ),
    body := jsonb_build_object(
      'userId', NEW.user_id::text,
      'title', NEW.title,
      'message', NEW.message,
      'type', NEW.type,
      'url', notification_url
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error queuing push notification: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_notification_created_send_push ON notifications;
CREATE TRIGGER on_notification_created_send_push
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_push_notification_trigger();

-- ======================================
-- Таблица образов стилистов (stylist looks/outfits)
-- ======================================

CREATE TABLE IF NOT EXISTS stylist_looks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stylist_id UUID REFERENCES stylists(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для stylist_looks
CREATE INDEX IF NOT EXISTS idx_stylist_looks_stylist_id ON stylist_looks(stylist_id);
CREATE INDEX IF NOT EXISTS idx_stylist_looks_created_at ON stylist_looks(created_at DESC);

-- Триггер для автообновления updated_at у образов
DROP TRIGGER IF EXISTS update_stylist_looks_updated_at ON stylist_looks;
CREATE TRIGGER update_stylist_looks_updated_at
  BEFORE UPDATE ON stylist_looks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ======================================
-- Таблица избранных образов
-- ======================================

CREATE TABLE IF NOT EXISTS favorite_looks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  look_id UUID REFERENCES stylist_looks(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, look_id) -- Один пользователь не может добавить один образ дважды
);

-- Индексы для favorite_looks
CREATE INDEX IF NOT EXISTS idx_favorite_looks_user_id ON favorite_looks(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_looks_look_id ON favorite_looks(look_id);

-- ======================================
-- RLS политики для stylist_looks
-- ======================================

ALTER TABLE stylist_looks ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики (если существуют)
DROP POLICY IF EXISTS "Looks are viewable by everyone" ON stylist_looks;
DROP POLICY IF EXISTS "Stylists can create own looks" ON stylist_looks;
DROP POLICY IF EXISTS "Stylists can update own looks" ON stylist_looks;
DROP POLICY IF EXISTS "Stylists can delete own looks" ON stylist_looks;

-- Все могут видеть образы (независимо от статуса стилиста)
CREATE POLICY "Looks are viewable by everyone" 
  ON stylist_looks FOR SELECT 
  USING (true);

-- Стилисты могут создавать свои образы
CREATE POLICY "Stylists can create own looks" 
  ON stylist_looks FOR INSERT 
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM stylists WHERE id = stylist_id
    )
  );

-- Стилисты могут обновлять свои образы
CREATE POLICY "Stylists can update own looks" 
  ON stylist_looks FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT user_id FROM stylists WHERE id = stylist_id
    )
  );

-- Стилисты могут удалять свои образы
CREATE POLICY "Stylists can delete own looks" 
  ON stylist_looks FOR DELETE 
  USING (
    auth.uid() IN (
      SELECT user_id FROM stylists WHERE id = stylist_id
    )
  );

-- ======================================
-- RLS политики для favorite_looks
-- ======================================

ALTER TABLE favorite_looks ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики (если существуют)
DROP POLICY IF EXISTS "Users can view own favorites" ON favorite_looks;
DROP POLICY IF EXISTS "Users can add to favorites" ON favorite_looks;
DROP POLICY IF EXISTS "Users can remove from favorites" ON favorite_looks;

-- Пользователи могут видеть только свои избранные
CREATE POLICY "Users can view own favorites" 
  ON favorite_looks FOR SELECT 
  USING (auth.uid() = user_id);

-- Пользователи могут добавлять образы в избранное
CREATE POLICY "Users can add to favorites" 
  ON favorite_looks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Пользователи могут удалять из избранного
CREATE POLICY "Users can remove from favorites" 
  ON favorite_looks FOR DELETE 
  USING (auth.uid() = user_id);

-- ======================================
-- Добавление брендов и цены к образам
-- ======================================

-- Добавляем поле для массива брендов
ALTER TABLE stylist_looks 
ADD COLUMN IF NOT EXISTS brands TEXT[] DEFAULT '{}';

-- Добавляем поле для стоимости в рублях
ALTER TABLE stylist_looks 
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2);

-- Комментарии для документации
COMMENT ON COLUMN stylist_looks.brands IS 'Массив брендов одежды, использованных в образе';
COMMENT ON COLUMN stylist_looks.price IS 'Примерная стоимость образа в рублях';

-- Индекс для поиска по брендам
CREATE INDEX IF NOT EXISTS idx_stylist_looks_brands ON stylist_looks USING GIN (brands);

-- ======================================
-- Добавление связи бронирования с образом
-- ======================================

-- Добавляем опциональное поле для связи бронирования с конкретным образом
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS look_id UUID REFERENCES stylist_looks(id) ON DELETE SET NULL;

-- Комментарий для документации
COMMENT ON COLUMN bookings.look_id IS 'ID образа стилиста, на который записался клиент (опционально)';

-- Индекс для поиска бронирований по образу
CREATE INDEX IF NOT EXISTS idx_bookings_look_id ON bookings(look_id);

-- ======================================
-- Готово! 
-- После выполнения этого скрипта ваша база данных готова к работе
-- ======================================

-- Обновлено: 20.11.2025
