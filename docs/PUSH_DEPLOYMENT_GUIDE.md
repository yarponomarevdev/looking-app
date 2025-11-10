# Руководство по развертыванию Push-уведомлений

## 📋 Обзор

Полное руководство по настройке и развертыванию серверной части push-уведомлений для PWA приложения.

---

## 🔑 Шаг 1: Генерация и настройка VAPID ключей

### 1.1 Генерация ключей

Уже сгенерированы ключи (см. вывод команды):

```bash
npx web-push generate-vapid-keys
```

**Результат:**
```
Public Key: BPczBqcwpi3u7Wfpn7dYiHkfOXHaI6uletj_N7HwCJ0hy0OFYl4_MuU48NuKNboJHN3f1o98X88bUOz-V3LCWqg
Private Key: wcjHrruKLGIDv7fgyvPwDgEW-P1UxTPBv238sNaikCk
```

### 1.2 Настройка локально

Создайте файл `.env` в корне проекта:

```bash
cp .env.example .env
```

Добавьте в `.env`:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# VAPID Keys
EXPO_PUBLIC_VAPID_PUBLIC_KEY=BPczBqcwpi3u7Wfpn7dYiHkfOXHaI6uletj_N7HwCJ0hy0OFYl4_MuU48NuKNboJHN3f1o98X88bUOz-V3LCWqg
VAPID_PRIVATE_KEY=wcjHrruKLGIDv7fgyvPwDgEW-P1UxTPBv238sNaikCk
```

⚠️ **ВАЖНО**: НЕ коммитьте файл `.env` в git!

### 1.3 Настройка в Vercel (для production)

В Vercel Dashboard → Settings → Environment Variables:

```
EXPO_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY = your_anon_key
EXPO_PUBLIC_VAPID_PUBLIC_KEY = BPczBqcwpi3u7Wfpn7dYiHkfOXHaI6uletj_N7HwCJ0hy0OFYl4_MuU48NuKNboJHN3f1o98X88bUOz-V3LCWqg
```

---

## 🗄️ Шаг 2: Настройка базы данных

### 2.1 Создание таблицы подписок

В Supabase Dashboard → SQL Editor выполните:

```sql
-- Файл: docs/PUSH_SUBSCRIPTIONS_MIGRATION.sql
-- Уже готов, просто выполните его
```

### 2.2 Включение HTTP расширения

```sql
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
```

### 2.3 Создание триггера

Выполните файл `docs/PUSH_TRIGGER_MIGRATION.sql` в SQL Editor.

**Важно**: Замените в триггере URL и service key на ваши:

```sql
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = 'your_service_role_key';
```

---

## 🚀 Шаг 3: Развертывание Edge Function

### 3.1 Установка Supabase CLI

```bash
# Windows (PowerShell)
scoop install supabase

# macOS
brew install supabase/tap/supabase

# Linux
curl -sL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar xz

# Или через NPM (любая ОС)
npm install -g supabase
```

### 3.2 Вход в аккаунт

```bash
supabase login
```

Откроется браузер для авторизации.

### 3.3 Связывание с проектом

```bash
# Получите Project Reference ID из Supabase Dashboard → Settings → General
supabase link --project-ref your-project-ref
```

### 3.4 Добавление секретов

```bash
supabase secrets set VAPID_PUBLIC_KEY=BPczBqcwpi3u7Wfpn7dYiHkfOXHaI6uletj_N7HwCJ0hy0OFYl4_MuU48NuKNboJHN3f1o98X88bUOz-V3LCWqg

supabase secrets set VAPID_PRIVATE_KEY=wcjHrruKLGIDv7fgyvPwDgEW-P1UxTPBv238sNaikCk

supabase secrets set VAPID_EMAIL=mailto:admin@your-domain.com
```

### 3.5 Деплой функции

```bash
supabase functions deploy send-push-notification
```

**Результат:**
```
Deploying function: send-push-notification
Function URL: https://your-project.supabase.co/functions/v1/send-push-notification
```

---

## ✅ Шаг 4: Тестирование

### 4.1 Тест Edge Function напрямую

В Supabase Dashboard → Edge Functions → send-push-notification → Invoke:

```json
{
  "userId": "user-uuid-here",
  "title": "Тест",
  "message": "Тестовое push-уведомление",
  "type": "test",
  "url": "/notifications"
}
```

### 4.2 Тест через приложение

1. Откройте PWA в браузере (Chrome/Edge)
2. Войдите в аккаунт
3. Разрешите уведомления когда появится промпт
4. Проверьте, что подписка создалась:

```sql
SELECT * FROM push_subscriptions WHERE user_id = 'your-user-id';
```

5. Создайте тестовое уведомление:

```sql
INSERT INTO notifications (user_id, type, title, message)
VALUES ('your-user-id', 'test', 'Тест', 'Проверка автоматической отправки');
```

6. Должно прийти push-уведомление!

### 4.3 Проверка логов

```bash
# Просмотр логов функции
supabase functions logs send-push-notification

# Или в Dashboard → Edge Functions → Logs
```

---

## 🔧 Устранение проблем

### Проблема: Функция не вызывается

**Решение:**
1. Проверьте, что триггер создан:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_notification_created_send_push';
```

2. Проверьте логи БД в Supabase Dashboard → Database → Logs

### Проблема: Ошибка VAPID ключей

**Решение:**
```bash
# Проверьте секреты
supabase secrets list

# Если нужно, удалите и создайте заново
supabase secrets unset VAPID_PUBLIC_KEY
supabase secrets set VAPID_PUBLIC_KEY=новый_ключ
```

### Проблема: HTTP extension не найден

**Решение:**
```sql
-- Включите расширение
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Проверьте
SELECT * FROM pg_extension WHERE extname = 'http';
```

### Проблема: CORS ошибки

**Решение:**
Edge Function уже включает CORS headers. Если проблема остается:

1. Проверьте URL функции
2. Убедитесь, что используете HTTPS
3. Проверьте токен авторизации

---

## 📊 Мониторинг

### Статистика отправок

```sql
-- Количество активных подписок
SELECT COUNT(*) FROM push_subscriptions;

-- Подписки по пользователям
SELECT user_id, COUNT(*) as devices 
FROM push_subscriptions 
GROUP BY user_id;

-- Недавние уведомления
SELECT * FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;
```

### Логи Edge Function

```bash
# Real-time логи
supabase functions logs send-push-notification --follow

# Последние 100 записей
supabase functions logs send-push-notification --limit 100
```

---

## 🎯 Чек-лист готовности

- [ ] VAPID ключи сгенерированы и сохранены
- [ ] Таблица `push_subscriptions` создана
- [ ] HTTP extension включен
- [ ] Триггер `on_notification_created_send_push` создан
- [ ] Параметры БД настроены (supabase_url, service_role_key)
- [ ] Edge Function задеплоена
- [ ] Секреты (VAPID ключи) добавлены в Supabase
- [ ] Тестовая отправка прошла успешно
- [ ] PWA подписка работает в браузере
- [ ] Уведомления приходят автоматически

---

## 📚 Полезные команды

```bash
# Supabase CLI
supabase --help
supabase functions --help
supabase functions list
supabase functions deploy --help

# Генерация новых VAPID ключей
npx web-push generate-vapid-keys

# Локальная разработка функции
supabase functions serve send-push-notification
```

---

## 🔐 Безопасность

1. **НИКОГДА** не коммитьте приватные ключи
2. Используйте разные ключи для dev и prod
3. Регулярно ротируйте VAPID ключи
4. Проверяйте RLS политики на таблице подписок
5. Мониторьте логи на подозрительную активность

---

## 🎉 Готово!

После выполнения всех шагов push-уведомления будут работать:

- ✅ Пользователи могут подписаться через PWA
- ✅ Подписки сохраняются в БД
- ✅ При создании уведомления автоматически отправляется push
- ✅ Service Worker показывает уведомление в браузере/ОС
- ✅ Клик по уведомлению открывает нужную страницу

**Документация:**
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [VAPID Protocol](https://tools.ietf.org/html/rfc8292)

