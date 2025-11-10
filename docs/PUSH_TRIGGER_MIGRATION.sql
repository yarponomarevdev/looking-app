-- Миграция для автоматической отправки push-уведомлений
-- Создает триггер, который вызывает Edge Function при создании уведомления

-- Включаем расширение для HTTP запросов (если еще не включено)
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Функция для отправки push-уведомления через Edge Function
CREATE OR REPLACE FUNCTION send_push_notification_trigger()
RETURNS TRIGGER AS $$
DECLARE
  notification_url TEXT;
  function_url TEXT;
  service_role_key TEXT;
  response_status INT;
BEGIN
  -- Определяем URL для перехода в зависимости от типа уведомления
  notification_url := CASE
    WHEN NEW.related_booking_id IS NOT NULL THEN '/bookings'
    WHEN NEW.type = 'booking_created' THEN '/bookings'
    WHEN NEW.type = 'booking_confirmed' THEN '/bookings'
    WHEN NEW.type = 'booking_rejected' THEN '/bookings'
    ELSE '/notifications'
  END;

  -- Получаем URL проекта и service role key из настроек
  -- ВАЖНО: Эти значения нужно установить в Supabase Dashboard → Settings → Vault
  -- или использовать pg_net для асинхронных запросов
  
  -- Формируем URL Edge Function
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push-notification';
  service_role_key := current_setting('app.settings.service_role_key', true);

  -- Проверяем, что настройки установлены
  IF function_url IS NULL OR service_role_key IS NULL THEN
    RAISE WARNING 'Supabase URL or Service Role Key not configured. Skipping push notification.';
    RETURN NEW;
  END IF;

  -- Вызываем Edge Function для отправки push-уведомления
  -- Используем extensions.http_post из расширения pgsql-http
  BEGIN
    SELECT status INTO response_status
    FROM extensions.http((
      'POST',
      function_url,
      ARRAY[
        extensions.http_header('Content-Type', 'application/json'),
        extensions.http_header('Authorization', 'Bearer ' || service_role_key)
      ],
      'application/json',
      json_build_object(
        'userId', NEW.user_id,
        'title', NEW.title,
        'message', NEW.message,
        'type', NEW.type,
        'url', notification_url
      )::text
    )::extensions.http_request);

    -- Логируем результат
    IF response_status >= 200 AND response_status < 300 THEN
      RAISE NOTICE 'Push notification sent successfully for notification %', NEW.id;
    ELSE
      RAISE WARNING 'Push notification failed with status % for notification %', response_status, NEW.id;
    END IF;

  EXCEPTION WHEN OTHERS THEN
    -- Не прерываем транзакцию, если отправка push не удалась
    RAISE WARNING 'Error sending push notification: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Удаляем старый триггер если существует
DROP TRIGGER IF EXISTS on_notification_created_send_push ON notifications;

-- Создаем триггер на создание уведомления
CREATE TRIGGER on_notification_created_send_push
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_push_notification_trigger();

-- Комментарии
COMMENT ON FUNCTION send_push_notification_trigger() IS 'Автоматически отправляет push-уведомление при создании записи в таблице notifications';
COMMENT ON TRIGGER on_notification_created_send_push ON notifications IS 'Триггер для автоматической отправки push-уведомлений';

-- ========================================
-- НАСТРОЙКА ПАРАМЕТРОВ (выполните отдельно)
-- ========================================

-- Замените на ваши реальные значения:
-- ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project.supabase.co';
-- ALTER DATABASE postgres SET app.settings.service_role_key = 'your_service_role_key_here';

-- Или создайте параметры на уровне сессии (для тестирования):
-- SET app.settings.supabase_url = 'https://your-project.supabase.co';
-- SET app.settings.service_role_key = 'your_service_role_key_here';

-- ========================================
-- АЛЬТЕРНАТИВА: Использование pg_net (рекомендуется)
-- ========================================

-- Supabase рекомендует использовать pg_net для асинхронных HTTP запросов
-- Если хотите использовать pg_net вместо http extension:

/*
CREATE OR REPLACE FUNCTION send_push_notification_trigger_async()
RETURNS TRIGGER AS $$
DECLARE
  notification_url TEXT;
BEGIN
  notification_url := CASE
    WHEN NEW.related_booking_id IS NOT NULL THEN '/bookings'
    ELSE '/notifications'
  END;

  PERFORM net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := jsonb_build_object(
      'userId', NEW.user_id,
      'title', NEW.title,
      'message', NEW.message,
      'type', NEW.type,
      'url', notification_url
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/

