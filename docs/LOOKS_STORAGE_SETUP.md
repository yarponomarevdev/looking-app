# Настройка хранилища для образов стилистов

Данный документ содержит инструкции по настройке Supabase Storage для хранения изображений образов стилистов.

## Шаг 1: Создание Storage Bucket

1. Откройте Supabase Dashboard
2. Перейдите в раздел **Storage**
3. Нажмите **New Bucket**
4. Укажите следующие параметры:
   - **Name**: `looks`
   - **Public bucket**: ✅ (включено)
   - **File size limit**: 5 MB (рекомендуется)
   - **Allowed MIME types**: `image/jpeg, image/jpg, image/png, image/webp`
5. Нажмите **Create bucket**

## Шаг 2: Настройка политик доступа (RLS)

Storage bucket `looks` использует следующие политики доступа:

### Политика для чтения (SELECT)

Все пользователи могут просматривать изображения образов:

```sql
CREATE POLICY "Public can view looks images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'looks');
```

### Политика для загрузки (INSERT)

Авторизованные пользователи могут загружать изображения:

```sql
CREATE POLICY "Authenticated users can upload looks images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'looks' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Политика для обновления (UPDATE)

Пользователи могут обновлять только свои изображения:

```sql
CREATE POLICY "Users can update own looks images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'looks'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Политика для удаления (DELETE)

Пользователи могут удалять только свои изображения:

```sql
CREATE POLICY "Users can delete own looks images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'looks'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## Шаг 3: Применение политик

1. Откройте **SQL Editor** в Supabase Dashboard
2. Скопируйте и выполните следующий SQL-скрипт:

```sql
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
```

## Шаг 4: Проверка настроек

После применения политик проверьте:

1. **Storage → looks** - bucket должен быть публичным
2. **Storage → Policies** - должны быть видны 4 политики для bucket `looks`
3. Попробуйте загрузить тестовое изображение через приложение

## Формат хранения файлов

Изображения образов хранятся в следующем формате:

```
looks/
  └── look-{user_id}-{timestamp}.{ext}
```

Где:
- `{user_id}` - UUID пользователя
- `{timestamp}` - Unix timestamp в миллисекундах
- `{ext}` - расширение файла (jpg, png, webp)

Пример: `look-a1b2c3d4-e5f6-7890-abcd-ef1234567890-1699876543210.jpg`

## Рекомендации

1. **Оптимизация изображений**: Изображения автоматически сжимаются с quality=0.7 перед загрузкой
2. **Соотношение сторон**: Рекомендуется 3:4 (как в Instagram)
3. **Максимальный размер**: 5 MB на файл
4. **Форматы**: JPEG, PNG, WebP

## Миграция данных

Если у вас уже есть образы в старом bucket:

```sql
-- Скопировать файлы из старого bucket
SELECT storage.copy_object(
  'old_bucket_name',
  'filename.jpg',
  'looks',
  'filename.jpg'
);
```

## Troubleshooting

### Ошибка "new row violates row-level security policy"

**Решение**: Проверьте, что политики применены корректно и bucket публичный.

### Ошибка "The resource already exists"

**Решение**: Bucket с именем `looks` уже существует. Используйте его или удалите старый.

### Изображения не загружаются

**Решение**: 
1. Проверьте публичность bucket
2. Проверьте политики RLS
3. Проверьте размер файла (не более 5 MB)

## Готово!

После выполнения всех шагов функционал загрузки образов будет полностью настроен.

