-- ======================================
-- Миграция статусов стилистов
-- С 3 статусов (available, busy, offline) на 2 статуса (active, inactive)
-- ======================================

-- ВАЖНО: Выполните этот скрипт в Supabase Dashboard -> SQL Editor
-- только если у вас УЖЕ ЕСТЬ стилисты с старыми статусами!

-- Шаг 1: Удаляем старое ограничение CHECK
ALTER TABLE stylists
DROP CONSTRAINT IF EXISTS stylists_status_check;

-- Шаг 2: Обновляем существующие данные
-- available -> active (остается активным)
-- busy -> active (занятые стилисты тоже считаются активными)
-- offline -> inactive (офлайн становится неактивным)
UPDATE stylists
SET status = CASE
  WHEN status IN ('available', 'busy') THEN 'active'
  WHEN status = 'offline' THEN 'inactive'
  ELSE 'active'  -- На всякий случай
END;

-- Шаг 3: Добавляем новое ограничение CHECK с новыми значениями
ALTER TABLE stylists
ADD CONSTRAINT stylists_status_check
CHECK (status IN ('active', 'inactive'));

-- Шаг 4: Устанавливаем значение по умолчанию
ALTER TABLE stylists
ALTER COLUMN status SET DEFAULT 'active';

-- ======================================
-- Проверка результатов
-- ======================================

-- Посмотрим распределение статусов
SELECT status, COUNT(*) as count
FROM stylists
GROUP BY status;

-- ======================================
-- Готово!
-- ======================================

