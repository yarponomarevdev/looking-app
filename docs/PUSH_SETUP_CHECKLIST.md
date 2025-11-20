# ✅ Чеклист настройки Push-уведомлений для PWA

## 📋 Статус компонентов

### ✅ Готово (не требует действий)
- [x] Таблица `push_subscriptions` создана с RLS
- [x] Edge Function `send-push-notification` задеплоена (версия 8)
- [x] Триггер `on_notification_created_send_push` создан
- [x] Service Worker с поддержкой push настроен
- [x] Хук `usePushNotifications` реализован
- [x] Security warning исправлен (search_path добавлен в функции)
- [x] HTTP extension установлен

---

## ⚠️ Требует настройки

### 1. **VAPID ключи в переменных окружения**

**Статус:** ⚠️ Требуется проверка

**Что сделать:**
```bash
# Добавьте в .env (если еще не добавлено)
EXPO_PUBLIC_VAPID_PUBLIC_KEY=BPczBqcwpi3u7Wfpn7dYiHkfOXHaI6uletj_N7HwCJ0hy0OFYl4_MuU48NuKNboJHN3f1o98X88bUOz-V3LCWqg
```

**После добавления:**
```bash
# Пересоберите веб-версию, чтобы ключ попал в service-worker.js
npm run build
# или
npx expo export --platform web
```

**Проверка:**
Откройте `dist/service-worker.js` и убедитесь, что:
```javascript
const VAPID_PUBLIC_KEY = 'BPczBqcwpi3u7Wfpn7dYiHkfOXHaI6uletj_N7HwCJ0hy0OFYl4_MuU48NuKNboJHN3f1o98X88bUOz-V3LCWqg';
// НЕ ДОЛЖНО БЫТЬ: const VAPID_PUBLIC_KEY = '[[VAPID_PUBLIC_KEY]]';
```

---

### 2. **Параметры БД для триггера**

**Статус:** ❌ НЕ НАСТРОЕНО

**Что сделать:**

1. Откройте **Supabase Dashboard** → Settings → API
2. Скопируйте `service_role` ключ (secret)
3. Выполните SQL из файла `docs/FIX_PUSH_CONFIG.sql`, заменив `<YOUR_SERVICE_ROLE_KEY>`

```sql
ALTER DATABASE postgres 
  SET app.settings.supabase_url = 'https://bblovvqoltasbbwzrjlb.supabase.co';

ALTER DATABASE postgres 
  SET app.settings.service_role_key = 'eyJhbGc...'; -- ваш ключ
```

**Проверка:**
```sql
SELECT 
  current_setting('app.settings.supabase_url', true) as supabase_url,
  CASE 
    WHEN current_setting('app.settings.service_role_key', true) IS NULL 
    THEN 'NOT SET ❌'
    ELSE 'SET ✅' 
  END as service_role_key_status;
```

Должны увидеть:
```
supabase_url: https://bblovvqoltasbbwzrjlb.supabase.co
service_role_key_status: SET ✅
```

---

### 3. **VAPID ключи в Supabase Secrets**

**Статус:** ⚠️ Требуется проверка

**Что сделать:**
```bash
# Проверьте, установлены ли секреты
supabase secrets list

# Если не установлены, добавьте:
supabase secrets set VAPID_PUBLIC_KEY=BPczBqcwpi3u7Wfpn7dYiHkfOXHaI6uletj_N7HwCJ0hy0OFYl4_MuU48NuKNboJHN3f1o98X88bUOz-V3LCWqg
supabase secrets set VAPID_PRIVATE_KEY=wcjHrruKLGIDv7fgyvPwDgEW-P1UxTPBv238sNaikCk
supabase secrets set VAPID_EMAIL=mailto:admin@looking-app.com
```

**⚠️ ВАЖНО:** Ключи должны совпадать с `EXPO_PUBLIC_VAPID_PUBLIC_KEY` в .env

---

## 🧪 Тестирование

### Шаг 1: Подписаться на push

1. Откройте PWA в браузере (Chrome/Edge)
2. Перейдите в профиль → Настройки уведомлений
3. Включите push-уведомления
4. Разрешите в браузере

### Шаг 2: Проверить подписку в БД

```sql
SELECT * FROM push_subscriptions;
```

Должна появиться запись с вашим `user_id` и `endpoint`.

### Шаг 3: Отправить тестовое уведомление

```sql
-- Замените user_id на свой
INSERT INTO notifications (user_id, title, message, type)
VALUES (
  'ваш-user-id',
  'Тест Push',
  'Это тестовое уведомление',
  'booking_created'
);
```

### Шаг 4: Проверить логи

**Supabase Dashboard** → Edge Functions → send-push-notification → Logs

Должны увидеть:
```
Sending push notification to user: ...
✅ Successfully sent to endpoint: https://fcm.googleapis.com/...
```

### Шаг 5: Получить уведомление

Вы должны увидеть всплывающее уведомление в браузере.

---

## 🐛 Troubleshooting

### Push не приходят

1. **Проверьте параметры БД:**
   ```sql
   SELECT current_setting('app.settings.supabase_url', true);
   SELECT current_setting('app.settings.service_role_key', true);
   ```
   Оба должны быть не NULL.

2. **Проверьте логи Edge Function:**
   - Dashboard → Edge Functions → send-push-notification → Logs
   - Ищите ошибки

3. **Проверьте VAPID в service-worker.js:**
   - Откройте DevTools → Application → Service Workers
   - Найдите `service-worker.js` и проверьте, что `VAPID_PUBLIC_KEY` не плейсхолдер

4. **Проверьте разрешения браузера:**
   - DevTools → Application → Notifications
   - Должно быть "Allowed"

### Service Worker не обновляется

```javascript
// В DevTools → Application → Service Workers
// Нажмите "Unregister" и перезагрузите страницу
```

### Подписка не сохраняется

Проверьте консоль браузера на ошибки VAPID:
```
Error subscribing to push notifications: VAPID public key is not configured
```

Решение: добавьте `EXPO_PUBLIC_VAPID_PUBLIC_KEY` в .env и пересоберите.

---

## 📊 Проверка статуса

Выполните SQL из `docs/FIX_PUSH_CONFIG.sql` (раздел "ТЕСТИРОВАНИЕ")

