-- ФИНАЛЬНАЯ НАСТРОЙКА: Добавление правильного service_role_key
-- ============================================================
--
-- ИНСТРУКЦИЯ:
-- 1. Откройте Supabase Dashboard → Settings → API → Project API keys
-- 2. Найдите "service_role" (secret) ключ
-- 3. Нажмите "Reveal" (открыть)
-- 4. Скопируйте ПОЛНОСТЬЮ весь ключ (начинается с eyJ...)
-- 5. Замените <ВСТАВЬТЕ_ВАШ_SERVICE_ROLE_KEY_ЗДЕСЬ> ниже на скопированный ключ
-- 6. Выполните этот SQL
--
-- ============================================================

CREATE OR REPLACE FUNCTION public.send_push_notification_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  notification_url TEXT;
  request_id BIGINT;
  service_role_key TEXT;
BEGIN
  -- Определяем URL для перехода
  notification_url := CASE
    WHEN NEW.related_booking_id IS NOT NULL THEN '/bookings'
    WHEN NEW.type = 'booking_created' THEN '/bookings'
    WHEN NEW.type = 'booking_confirmed' THEN '/bookings'
    WHEN NEW.type = 'booking_rejected' THEN '/bookings'
    ELSE '/notifications'
  END;

  -- ============================================================
  -- ЗАМЕНИТЕ ЗДЕСЬ: Вставьте ваш service_role ключ
  -- ============================================================
  service_role_key := '<ВСТАВЬТЕ_ВАШ_SERVICE_ROLE_KEY_ЗДЕСЬ>';
  -- ============================================================

  -- Проверяем, что ключ установлен
  IF service_role_key IS NULL OR service_role_key = '' OR service_role_key = '<ВСТАВЬТЕ_ВАШ_SERVICE_ROLE_KEY_ЗДЕСЬ>' THEN
    RAISE WARNING 'Service role key not configured. Skipping push notification.';
    RETURN NEW;
  END IF;

  -- Отправляем асинхронный HTTP запрос через pg_net
  SELECT extensions.net.http_post(
    url := 'https://bblovvqoltasbbwzrjlb.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'userId', NEW.user_id::text,
      'title', NEW.title,
      'message', NEW.message,
      'type', NEW.type,
      'url', notification_url
    )
  ) INTO request_id;

  -- Логируем успех
  RAISE NOTICE 'Push notification queued with request_id: % for notification: %', request_id, NEW.id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Не прерываем транзакцию
  RAISE WARNING 'Error queuing push notification: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- ============================================================
-- ТЕСТ: Проверьте, что работает
-- ============================================================

-- После обновления функции, создайте тестовое уведомление:
/*
INSERT INTO notifications (user_id, title, message, type)
VALUES (
  'b782e190-89e7-453d-a5cb-ce2f25ba33dc', -- ваш user_id
  'Финальный тест',
  'Проверка с правильным service_role_key',
  'booking_created'
);
*/

-- Проверьте логи Postgres - должно быть:
-- NOTICE: Push notification queued with request_id: ...

-- Проверьте логи Edge Function - должно быть:
-- ✅ Successfully sent to endpoint: ...
