-- ======================================
-- Миграция: Перевод стоимости образа в текстовый формат
-- Выполните этот скрипт в Supabase Dashboard -> SQL Editor
-- ======================================

ALTER TABLE stylist_looks
ALTER COLUMN price TYPE TEXT
USING (
  CASE
    WHEN price IS NULL THEN NULL
    ELSE trim(trailing '.' FROM trim(trailing '0' FROM price::TEXT))
  END
);

COMMENT ON COLUMN stylist_looks.price IS 'Примерная стоимость образа в свободном формате';







