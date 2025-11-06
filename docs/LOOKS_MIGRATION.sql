-- ======================================
-- Миграция для функционала "Лента образов стилистов"
-- Выполните этот скрипт в Supabase Dashboard -> SQL Editor
-- ======================================

-- ======================================
-- ТАБЛИЦА ОБРАЗОВ СТИЛИСТОВ
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

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_stylist_looks_stylist_id ON stylist_looks(stylist_id);
CREATE INDEX IF NOT EXISTS idx_stylist_looks_created_at ON stylist_looks(created_at DESC);

-- Комментарии для документации
COMMENT ON TABLE stylist_looks IS 'Образы стилистов (аналог постов в Instagram)';
COMMENT ON COLUMN stylist_looks.stylist_id IS 'ID стилиста, создавшего образ';
COMMENT ON COLUMN stylist_looks.title IS 'Название образа';
COMMENT ON COLUMN stylist_looks.description IS 'Описание образа (опционально)';
COMMENT ON COLUMN stylist_looks.image_url IS 'URL изображения в Supabase Storage';

-- ======================================
-- ТАБЛИЦА ИЗБРАННЫХ ОБРАЗОВ
-- ======================================

CREATE TABLE IF NOT EXISTS favorite_looks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  look_id UUID REFERENCES stylist_looks(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, look_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_favorite_looks_user_id ON favorite_looks(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_looks_look_id ON favorite_looks(look_id);

-- Комментарии
COMMENT ON TABLE favorite_looks IS 'Избранные образы пользователей';
COMMENT ON COLUMN favorite_looks.user_id IS 'ID пользователя';
COMMENT ON COLUMN favorite_looks.look_id IS 'ID избранного образа';

-- ======================================
-- ТРИГГЕРЫ
-- ======================================

-- Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_stylist_looks_updated_at ON stylist_looks;
CREATE TRIGGER update_stylist_looks_updated_at
  BEFORE UPDATE ON stylist_looks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ======================================
-- RLS ПОЛИТИКИ ДЛЯ STYLIST_LOOKS
-- ======================================

-- Включаем RLS
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
-- RLS ПОЛИТИКИ ДЛЯ FAVORITE_LOOKS
-- ======================================

-- Включаем RLS
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
-- STORAGE BUCKET ПОЛИТИКИ
-- ======================================

-- Примечание: Создайте bucket 'looks' через UI (Storage → New Bucket)
-- Затем примените следующие политики:

-- Включаем RLS для storage.objects (если еще не включен)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики для bucket 'looks' (если существуют)
DROP POLICY IF EXISTS "Public can view looks images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload looks images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own looks images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own looks images" ON storage.objects;

-- Все пользователи могут просматривать изображения
CREATE POLICY "Public can view looks images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'looks');

-- Авторизованные пользователи могут загружать изображения
CREATE POLICY "Authenticated users can upload looks images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'looks');

-- Пользователи могут обновлять свои изображения
CREATE POLICY "Users can update own looks images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'looks');

-- Пользователи могут удалять свои изображения
CREATE POLICY "Users can delete own looks images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'looks');

-- ======================================
-- ТЕСТОВЫЕ ДАННЫЕ (опционально)
-- ======================================

-- Раскомментируйте, чтобы добавить тестовые образы
/*
-- Предварительно получите ID существующего стилиста:
-- SELECT id, user_id FROM stylists LIMIT 1;

-- Вставка тестового образа
INSERT INTO stylist_looks (stylist_id, title, description, image_url)
VALUES (
  'YOUR_STYLIST_ID_HERE', -- Замените на реальный ID стилиста
  'Деловой стиль для офиса',
  'Элегантный образ для деловых встреч. Сочетание классики и современности.',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800' -- Тестовое изображение
);

-- Добавление в избранное (замените на реальные ID)
INSERT INTO favorite_looks (user_id, look_id)
VALUES (
  'YOUR_USER_ID_HERE',
  (SELECT id FROM stylist_looks LIMIT 1)
);
*/

-- ======================================
-- ПРОВЕРКА УСТАНОВКИ
-- ======================================

-- Проверка созданных таблиц
SELECT 
  table_name, 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('stylist_looks', 'favorite_looks')
ORDER BY table_name;

-- Проверка индексов
SELECT 
  tablename, 
  indexname, 
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename IN ('stylist_looks', 'favorite_looks')
ORDER BY tablename, indexname;

-- Проверка RLS политик
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('stylist_looks', 'favorite_looks')
ORDER BY tablename, policyname;

-- ======================================
-- ГОТОВО!
-- ======================================

-- После выполнения этого скрипта:
-- 1. Создайте bucket 'looks' в Storage (если еще не создан)
-- 2. Сделайте его публичным
-- 3. Перезапустите приложение
-- 4. Проверьте работу функционала

-- Для проверки можно выполнить:
SELECT COUNT(*) as total_looks FROM stylist_looks;
SELECT COUNT(*) as total_favorites FROM favorite_looks;

