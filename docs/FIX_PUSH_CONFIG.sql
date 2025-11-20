-- ============================================================
-- КРИТИЧНАЯ НАСТРОЙКА: Конфигурация push-уведомлений
-- ============================================================
-- Этот файл содержит SQL команды для настройки автоматической
-- отправки push-уведомлений через триггер БД
-- ============================================================

-- ШАГ 1: Настройка параметров базы данных
-- Замените <YOUR_SERVICE_ROLE_KEY> на реальный ключ из Supabase Dashboard
-- Settings → API → Project API keys → service_role (secret)

ALTER DATABASE postgres 
  SET app.settings.supabase_url = 'https://bblovvqoltasbbwzrjlb.supabase.co';

ALTER DATABASE postgres 
  SET app.settings.service_role_key = '<YOUR_SERVICE_ROLE_KEY>';

-- ШАГ 2: Применить настройки (опционально, обычно применяются автоматически)
-- SELECT pg_reload_conf();

-- ШАГ 3: Проверка настроек
SELECT 
  current_setting('app.settings.supabase_url', true) as supabase_url,
  CASE 
    WHEN current_setting('app.settings.service_role_key', true) IS NULL THEN 'NOT SET ❌'
    ELSE 'SET ✅' 
  END as service_role_key_status;

-- ============================================================
-- ТЕСТИРОВАНИЕ: Проверка работы push-уведомлений
-- ============================================================

-- 1. Создайте тестовое уведомление (замените USER_ID на реальный)
-- INSERT INTO notifications (user_id, title, message, type)
-- VALUES (
--   'b782e190-89e7-453d-a5cb-ce2f25ba33dc', -- замените на свой user_id
--   'Тест',
--   'Это тестовое push-уведомление',
--   'booking_created'
-- );

-- 2. Проверьте логи в Supabase Dashboard → Edge Functions → send-push-notification → Logs
-- Должны увидеть:
-- - "Sending push notification to user: ..."
-- - "✅ Successfully sent to endpoint: ..."

-- 3. Проверьте активные подписки
-- SELECT * FROM push_subscriptions;

-- ============================================================
-- TROUBLESHOOTING
-- ============================================================

-- Проверить, что триггер создан
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_notification_created_send_push';

-- Проверить, что функция существует и имеет search_path
SELECT 
  proname as function_name,
  prosecdef as security_definer,
  proconfig as settings
FROM pg_proc
WHERE proname = 'send_push_notification_trigger';
-- Ожидается: settings = {search_path=}

-- Проверить наличие расширения http
SELECT * FROM pg_extension WHERE extname = 'http';

-- Посмотреть последние уведомления
SELECT id, user_id, title, message, type, created_at 
FROM notifications 
ORDER BY created_at DESC 
LIMIT 5;

