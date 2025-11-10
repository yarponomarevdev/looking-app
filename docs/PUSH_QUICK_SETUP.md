# Быстрая настройка Push-уведомлений ⚡

Краткая инструкция для развертывания push-уведомлений за 10 минут.

---

## ✅ Что уже готово

- ✅ VAPID ключи сгенерированы
- ✅ Edge Function создана
- ✅ SQL миграции готовы
- ✅ Клиентская часть работает
- ✅ Service Worker настроен

---

## 🚀 5 простых шагов

### 1️⃣ Установите Supabase CLI

```bash
npm install -g supabase
```

### 2️⃣ Войдите и свяжите проект

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

> 💡 **Где найти PROJECT_REF?**  
> Supabase Dashboard → Settings → General → Reference ID

### 3️⃣ Установите VAPID ключи

```bash
supabase secrets set VAPID_PUBLIC_KEY=BPczBqcwpi3u7Wfpn7dYiHkfOXHaI6uletj_N7HwCJ0hy0OFYl4_MuU48NuKNboJHN3f1o98X88bUOz-V3LCWqg

supabase secrets set VAPID_PRIVATE_KEY=wcjHrruKLGIDv7fgyvPwDgEW-P1UxTPBv238sNaikCk

supabase secrets set VAPID_EMAIL=mailto:admin@your-domain.com
```

### 4️⃣ Деплой Edge Function

```bash
supabase functions deploy send-push-notification
```

✅ Вы получите URL функции:
```
Function URL: https://your-project.supabase.co/functions/v1/send-push-notification
```

### 5️⃣ Выполните SQL миграции

В Supabase Dashboard → SQL Editor выполните **по очереди**:

#### А) Таблица подписок

```sql
-- Скопируйте содержимое файла:
-- docs/PUSH_SUBSCRIPTIONS_MIGRATION.sql
```

#### Б) Триггер для автоотправки

```sql
-- Скопируйте содержимое файла:
-- docs/PUSH_TRIGGER_MIGRATION.sql

-- ⚠️ ВАЖНО: Замените на ваши значения:
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://YOUR-PROJECT.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
```

> 💡 **Где найти Service Role Key?**  
> Supabase Dashboard → Settings → API → Project API keys → service_role

---

## ✅ Проверка работы

### Тест 1: Прямой вызов функции

В Supabase Dashboard → Edge Functions → send-push-notification → Invoke:

```json
{
  "userId": "YOUR_USER_UUID",
  "title": "Тест",
  "message": "Проверка работы push",
  "type": "test",
  "url": "/notifications"
}
```

### Тест 2: Через приложение

1. Откройте PWA в Chrome/Edge
2. Войдите в аккаунт
3. Разрешите уведомления
4. Создайте тестовое уведомление в SQL:

```sql
INSERT INTO notifications (user_id, type, title, message)
VALUES ('YOUR_USER_UUID', 'test', 'Тест', 'Автоматическая отправка работает!');
```

5. Должно прийти push-уведомление! 🎉

---

## 🔍 Устранение проблем

### Проблема: "No subscriptions found"

**Решение:**
1. Проверьте, что вы разрешили уведомления в браузере
2. Проверьте таблицу:
```sql
SELECT * FROM push_subscriptions WHERE user_id = 'YOUR_USER_UUID';
```

### Проблема: Функция не вызывается автоматически

**Решение:**
1. Проверьте, что триггер создан:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_notification_created_send_push';
```

2. Проверьте параметры БД:
```sql
SHOW app.settings.supabase_url;
SHOW app.settings.service_role_key;
```

### Проблема: VAPID ошибка

**Решение:**
```bash
# Проверьте секреты
supabase secrets list

# Если нужно, пересоздайте
supabase secrets unset VAPID_PUBLIC_KEY
supabase secrets set VAPID_PUBLIC_KEY=ваш_ключ
```

---

## 📊 Проверка статуса

```sql
-- Количество активных подписок
SELECT COUNT(*) as total_subscriptions FROM push_subscriptions;

-- Подписки по пользователям
SELECT user_id, COUNT(*) as devices 
FROM push_subscriptions 
GROUP BY user_id;

-- Недавние уведомления
SELECT * FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 📚 Дополнительно

Полная документация: [PUSH_DEPLOYMENT_GUIDE.md](./PUSH_DEPLOYMENT_GUIDE.md)

Edge Function README: [../supabase/functions/send-push-notification/README.md](../supabase/functions/send-push-notification/README.md)

---

## 🎯 Чек-лист

- [ ] Supabase CLI установлен
- [ ] Проект связан (`supabase link`)
- [ ] VAPID секреты установлены
- [ ] Edge Function задеплоена
- [ ] Таблица `push_subscriptions` создана
- [ ] Триггер создан
- [ ] Параметры БД настроены
- [ ] Тестовая отправка работает ✅

---

**Время выполнения**: ~10 минут  
**Сложность**: Средняя  
**Результат**: Полностью работающие push-уведомления 🚀

