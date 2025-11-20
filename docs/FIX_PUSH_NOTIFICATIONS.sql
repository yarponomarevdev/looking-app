-- ======================================
-- Исправление push-уведомлений для PWA
-- Решает проблемы с триггером и безопасностью
-- ======================================

-- 1. Включаем расширение pg_net для асинхронных HTTP запросов (рекомендуется Supabase)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Исправляем функцию триггера с правильным search_path и использованием pg_net
-- ВАЖНО: Замените YOUR_SERVICE_ROLE_KEY на реальный ключ из Supabase Dashboard -> Settings -> API
CREATE OR REPLACE FUNCTION send_push_notification_trigger()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  notification_url TEXT;
  function_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Определяем URL для перехода в зависимости от типа уведомления
  notification_url := CASE
    WHEN NEW.related_booking_id IS NOT NULL THEN '/bookings'
    WHEN NEW.type = 'booking_created' THEN '/bookings'
    WHEN NEW.type = 'booking_confirmed' THEN '/bookings'
    WHEN NEW.type = 'booking_rejected' THEN '/bookings'
    ELSE '/notifications'
  END;

  -- URL Edge Function (замените на ваш проект URL)
  function_url := 'https://bblovvqoltasbbwzrjlb.supabase.co/functions/v1/send-push-notification';
  
  -- Получаем service_role_key из параметров БД или используем значение по умолчанию
  -- ВАЖНО: Установите параметр через: ALTER DATABASE postgres SET app.settings.service_role_key = 'your_key';
  service_role_key := COALESCE(
    current_setting('app.settings.service_role_key', true),
    'YOUR_SERVICE_ROLE_KEY' -- Замените на реальный ключ или используйте vault
  );

  -- Используем pg_net для асинхронного HTTP запроса (не блокирует транзакцию)
  -- pg_net выполняет запросы асинхронно в фоне
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key,
      'apikey', service_role_key -- Некоторые Edge Functions требуют apikey заголовок
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
  -- Не прерываем транзакцию, если отправка push не удалась
  RAISE WARNING 'Error sending push notification: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- 3. Пересоздаем триггер
DROP TRIGGER IF EXISTS on_notification_created_send_push ON notifications;

CREATE TRIGGER on_notification_created_send_push
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_push_notification_trigger();

-- 4. Настраиваем параметры базы данных (замените на ваши реальные значения)
-- ВАЖНО: Выполните эти команды отдельно с правами суперпользователя
-- или используйте Supabase Dashboard -> Settings -> Database -> Connection Pooling

-- Для получения service_role_key:
-- 1. Перейдите в Supabase Dashboard -> Settings -> API
-- 2. Скопируйте "service_role" key (НЕ anon key!)
-- 3. Выполните команды ниже:

/*
-- Установка параметров на уровне базы данных (требует прав суперпользователя)
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://bblovvqoltasbbwzrjlb.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY_HERE';

-- Или используйте Supabase Vault для безопасного хранения секретов:
-- SELECT vault.create_secret('service_role_key', 'YOUR_SERVICE_ROLE_KEY_HERE');
-- Затем в функции используйте: vault.get_secret('service_role_key')
*/

-- 5. Исправляем функцию обновления updated_at для push_subscriptions
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Комментарии
COMMENT ON FUNCTION send_push_notification_trigger() IS 
  'Автоматически отправляет push-уведомление при создании записи в таблице notifications. Использует pg_net для асинхронных запросов.';
COMMENT ON TRIGGER on_notification_created_send_push ON notifications IS 
  'Триггер для автоматической отправки push-уведомлений через Edge Function';

