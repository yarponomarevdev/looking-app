# Настройка переменных окружения

## Файл .env

Создайте файл `.env` в корне проекта на основе `.env.example`:

```bash
cp .env.example .env
```

## Необходимые переменные

### 1. Supabase (обязательно)

Получите эти значения из Supabase Dashboard → Settings → API:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_public_anon_key
```

### 2. VAPID ключи для Push-уведомлений (для PWA)

Если хотите использовать push-уведомления, сгенерируйте VAPID ключи:

```bash
npx web-push generate-vapid-keys
```

Добавьте в `.env`:

```env
EXPO_PUBLIC_VAPID_PUBLIC_KEY=your_generated_public_key
VAPID_PRIVATE_KEY=your_generated_private_key
```

**Важно:** 
- `EXPO_PUBLIC_VAPID_PUBLIC_KEY` будет доступен в клиентском коде
- `VAPID_PRIVATE_KEY` используется только на сервере (Edge Functions)
- НЕ коммитьте файл `.env` в git!

## Настройка для разных окружений

### Development (локально)

Используйте `.env` файл как описано выше.

### Production (Vercel)

Добавьте переменные окружения в Vercel Dashboard:

1. Откройте ваш проект в Vercel
2. Settings → Environment Variables
3. Добавьте каждую переменную:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_VAPID_PUBLIC_KEY` (опционально)

### Supabase Edge Functions

Для использования VAPID ключей в Edge Functions:

1. Откройте Supabase Dashboard → Edge Functions → Settings
2. Добавьте секреты:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`

## Проверка

Чтобы убедиться, что переменные загружены правильно:

```typescript
// В любом файле
console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
```

Переменные с префиксом `EXPO_PUBLIC_` доступны в клиентском коде.
Переменные без префикса доступны только на сервере.

