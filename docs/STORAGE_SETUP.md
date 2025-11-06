# Настройка Supabase Storage для аватаров

Этот документ описывает, как настроить Supabase Storage для загрузки аватаров пользователей.

## Шаги настройки

### 1. Создание Storage Bucket

1. Перейдите в Supabase Dashboard
2. Откройте раздел **Storage**
3. Нажмите **Create a new bucket**
4. Введите имя bucket: `avatars`
5. Установите **Public bucket**: `true` (чтобы аватары были доступны без авторизации)
6. Нажмите **Create bucket**

### 2. Настройка Storage Policies

После создания bucket нужно настроить политики доступа (RLS).

Перейдите в **Storage** → **Policies** для bucket `avatars` и добавьте следующие политики:

#### Политика 1: Публичное чтение

Все пользователи могут читать аватары:

```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

#### Политика 2: Загрузка аватара

Авторизованные пользователи могут загружать свои аватары:

```sql
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (name LIKE auth.uid()::text || '-%' OR auth.uid()::text = split_part(name, '-', 1))
);
```

#### Политика 3: Обновление аватара

Авторизованные пользователи могут обновлять свои аватары:

```sql
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (name LIKE auth.uid()::text || '-%' OR auth.uid()::text = split_part(name, '-', 1))
);
```

#### Политика 4: Удаление аватара

Авторизованные пользователи могут удалять свои аватары:

```sql
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (name LIKE auth.uid()::text || '-%' OR auth.uid()::text = split_part(name, '-', 1))
);
```

### 3. Структура хранения

Аватары сохраняются в bucket `avatars` со следующей структурой имени файла:

```
{user_id}-{timestamp}.{ext}
```

Например:
```
550e8400-e29b-41d4-a716-446655440000-1699283472000.jpg
```

Полный путь в Storage:
```
avatars/550e8400-e29b-41d4-a716-446655440000-1699283472000.jpg
```

## Проверка настройки

После настройки:

1. Запустите приложение
2. Войдите в аккаунт
3. Перейдите в профиль
4. Нажмите на аватар и выберите изображение
5. Аватар должен успешно загрузиться

## Troubleshooting

### Ошибка "new row violates row-level security policy"

Проблема: Политики Storage не настроены правильно.

Решение: Убедитесь, что все политики из шага 2 добавлены корректно.

### Ошибка "Bucket not found"

Проблема: Bucket `avatars` не создан.

Решение: Создайте bucket согласно шагу 1.

### Изображения не отображаются

Проблема 1: Bucket не публичный.

Решение: Убедитесь, что при создании bucket была установлена галочка **Public bucket**.

Проблема 2: Политика чтения не настроена.

Решение: Добавьте политику "Public Access" из шага 2.

## SQL скрипт для быстрой настройки

Выполните этот скрипт в **SQL Editor** Supabase Dashboard:

```sql
-- Создаем bucket (если еще не создан через UI)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Политики доступа
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (name LIKE auth.uid()::text || '-%' OR auth.uid()::text = split_part(name, '-', 1))
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (name LIKE auth.uid()::text || '-%' OR auth.uid()::text = split_part(name, '-', 1))
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (name LIKE auth.uid()::text || '-%' OR auth.uid()::text = split_part(name, '-', 1))
);
```

## Готово!

После выполнения всех шагов функционал загрузки аватаров будет работать в приложении.

