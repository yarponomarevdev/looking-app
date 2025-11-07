-- ======================================
-- Миграция: Добавление брендов и цены к образам
-- Выполните этот скрипт в Supabase Dashboard -> SQL Editor
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

