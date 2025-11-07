-- ======================================
-- Миграция: Изменение дефолтного статуса стилистов на 'inactive'
-- Выполните этот скрипт в Supabase Dashboard -> SQL Editor
-- ======================================

-- Изменяем дефолтное значение статуса на 'inactive'
ALTER TABLE stylists 
ALTER COLUMN status SET DEFAULT 'inactive';

-- Обновляем существующих стилистов со статусом 'active' на 'inactive' (опционально)
-- Раскомментируйте следующую строку, если хотите сбросить всех стилистов на 'inactive'
-- UPDATE stylists SET status = 'inactive' WHERE status = 'active';

-- Комментарий для документации
COMMENT ON COLUMN stylists.status IS 'Статус стилиста: active (активен, работает в одном ТЦ) или inactive (не активен)';

