# 🎯 Push-уведомления - Финальный тест

## ✅ Настройка завершена!

Все серверные компоненты настроены:

- ✅ **База данных**: таблица `push_subscriptions`, триггер
- ✅ **Edge Function**: `send-push-notification` v8 (нативная реализация)
- ✅ **VAPID секреты**: установлены в Supabase Dashboard
- ✅ **Клиентская часть**: Service Worker, хуки, UI компоненты

---

## ⚠️ ВАЖНО: Создайте новую подписку!

**Старые подписки были удалены**, так как они использовали другой VAPID ключ.

### Почему это важно?

Firebase Cloud Messaging (и другие push-сервисы) строго привязывают подписку к VAPID ключу. Если ключ изменился, старые подписки становятся невалидными и возвращают **403 Forbidden**.

---

## 🚀 Шаги для тестирования

### Шаг 1: Откройте приложение

Откройте ваше приложение в браузере (Chrome/Edge рекомендуется):
- **Vercel**: https://your-app.vercel.app
- **Localhost**: http://localhost:8081

### Шаг 2: Разрешите уведомления

При первом входе (или после удаления старой подписки) браузер попросит разрешение.

**Нажмите "Разрешить"** ✅

Приложение автоматически:
1. Зарегистрирует Service Worker
2. Подпишется на push-уведомления с новым VAPID ключом
3. Сохранит подписку в базе данных

### Шаг 3: Проверьте подписку в базе

Откройте **Supabase Dashboard → SQL Editor** и выполните:

```sql
SELECT id, user_id, endpoint, created_at 
FROM push_subscriptions 
WHERE user_id = 'b7ac89f2-25ba-4e50-8c97-f6de2fe9d145';
```

Вы должны увидеть **новую подписку** с текущим временем создания.

### Шаг 4: Отправьте тестовое уведомление

В SQL Editor выполните:

```sql
INSERT INTO notifications (user_id, type, title, message)
VALUES (
  'b7ac89f2-25ba-4e50-8c97-f6de2fe9d145',
  'booking_confirmed',
  '🎉 Всё работает!',
  'Push-уведомления настроены правильно!'
);
```

### Шаг 5: Проверьте результат

Вы должны увидеть **уведомление на экране**! 🎊

---

## 🔍 Что происходит под капотом

1. **INSERT в `notifications`** → триггер `on_notification_created_send_push`
2. **Триггер вызывает** Edge Function `send-push-notification`
3. **Edge Function:**
   - Находит все подписки пользователя
   - Генерирует VAPID JWT подпись
   - Отправляет HTTP POST на каждый endpoint
4. **Push-сервис** (FCM/Mozilla) доставляет уведомление
5. **Service Worker** получает событие и показывает уведомление

---

## 📊 Проверка логов

Если уведомление не пришло, проверьте логи:

### Edge Function логи:

**Supabase Dashboard** → **Edge Functions** → **send-push-notification** → **Logs**

Ищите:
- ✅ `Sending push notification to user: ...`
- ✅ `✅ Sent to: https://fcm.googleapis.com/...`
- ❌ `❌ Failed: ... Error: Push failed: 403 Forbidden`

### Проверка статуса функции:

```sql
-- Прямой вызов для проверки
SELECT 
  status,
  content::json as response
FROM extensions.http((
  'POST',
  'https://bblovvqoltasbbwzrjlb.supabase.co/functions/v1/send-push-notification',
  ARRAY[
    extensions.http_header('Content-Type', 'application/json'),
    extensions.http_header('Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY')
  ],
  'application/json',
  json_build_object(
    'userId', 'b7ac89f2-25ba-4e50-8c97-f6de2fe9d145',
    'title', '🧪 Тест',
    'message', 'Проверка работы функции'
  )::text
)::extensions.http_request);
```

Должно вернуть:
```json
{
  "success": true,
  "message": "Sent to 1 device(s)",
  "sent": 1,
  "failed": 0
}
```

---

## ❓ Troubleshooting

### 1. Уведомление не пришло

**Проблема:** Подписка не создана.

**Решение:**
- Проверьте DevTools → Console на ошибки
- Убедитесь, что Service Worker зарегистрирован: DevTools → Application → Service Workers
- Проверьте разрешения: `chrome://settings/content/notifications`

---

### 2. 403 Forbidden в логах

**Проблема:** Подписка создана с другим VAPID ключом.

**Решение:**
```sql
-- Удалите старую подписку
DELETE FROM push_subscriptions 
WHERE user_id = 'b7ac89f2-25ba-4e50-8c97-f6de2fe9d145';
```

Затем обновите страницу и разрешите уведомления заново.

---

### 3. 404 Not Found в логах

**Проблема:** Endpoint устарел или удалён push-сервисом.

**Решение:** То же, что и для 403 - удалите подписку и создайте новую.

---

### 4. No subscriptions found

**Проблема:** Пользователь не подписан на уведомления.

**Решение:**
1. Откройте приложение в браузере
2. Нажмите "Разрешить" когда браузер попросит разрешение
3. Проверьте, что подписка появилась в базе (см. Шаг 3)

---

### 5. Service Worker не регистрируется

**Проблема:** HTTPS требуется для Service Workers (кроме localhost).

**Решение:**
- Используйте HTTPS (Vercel автоматически предоставляет)
- Или тестируйте на localhost

---

## 🎓 Технические детали

### VAPID ключи

```
Public:  BPczBqcwpi3u7Wfpn7dYiHkfOXHaI6uletj_N7HwCJ0hy0OFYl4_MuU48NuKNboJHN3f1o98X88bUOz-V3LCWqg
Private: wcjHrruKLGIDv7fgyvPwDgEW-P1UxTPBv238sNaikCk
Email:   yaroslavponomarev.pro@gmail.com
```

### Edge Function

- **Версия**: 8
- **URL**: https://bblovvqoltasbbwzrjlb.supabase.co/functions/v1/send-push-notification
- **Реализация**: Нативная (Web Crypto API, без внешних библиотек)
- **Формат**: VAPID JWT (ES256) + пустой payload

### Почему пустой payload?

Полная реализация Web Push требует AES128GCM шифрования payload с использованием ECDH. Это очень сложная криптография.

**Текущее решение:**
- Отправляем пустое уведомление
- Service Worker получает событие
- Service Worker **сам** создаёт уведомление с нужным текстом

Это работает, но:
- ❌ Не передаёт данные от сервера к SW
- ✅ Простая и надёжная реализация
- ✅ Работает с Firebase Cloud Messaging

**Будущее улучшение:** Добавить полное шифрование payload для передачи данных.

---

## 📚 Дополнительные ресурсы

- [Web Push Protocol (RFC 8030)](https://datatracker.ietf.org/doc/html/rfc8030)
- [VAPID (RFC 8292)](https://datatracker.ietf.org/doc/html/rfc8292)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

---

## ✅ Чек-лист готовности

- [x] VAPID ключи сгенерированы
- [x] Edge Function задеплоена (v8)
- [x] Секреты установлены в Supabase
- [x] Таблица `push_subscriptions` создана
- [x] Триггер `on_notification_created_send_push` создан
- [x] HTTP extension установлен
- [ ] **Новая подписка создана** ⬅️ **СДЕЛАЙТЕ ЭТО!**
- [ ] Тестовое уведомление отправлено
- [ ] Уведомление получено

---

## 🎉 Готово!

После создания новой подписки всё должно работать идеально!

**Напомню:**
1. Откройте приложение
2. Разрешите уведомления
3. Проверьте подписку в базе
4. Отправьте тестовое уведомление
5. Наслаждайтесь результатом! 🚀

---

**Дата:** 2025-11-10  
**Edge Function версия:** 8  
**Статус:** Готово к тестированию ✅

