# Send Push Notification Edge Function

Edge Function для отправки Web Push уведомлений пользователям PWA приложения.

## Описание

Эта функция получает информацию об уведомлении, находит все активные подписки пользователя и отправляет push-уведомление на все его устройства.

## Использование

### HTTP Request

```
POST /functions/v1/send-push-notification
```

### Headers

```
Authorization: Bearer YOUR_SERVICE_ROLE_KEY
Content-Type: application/json
```

### Body Parameters

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| userId | string | Да | UUID пользователя |
| title | string | Да | Заголовок уведомления |
| message | string | Да | Текст уведомления |
| type | string | Нет | Тип уведомления (booking_created, etc.) |
| url | string | Нет | URL для перехода при клике |

### Пример запроса

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/send-push-notification' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Новая запись",
    "message": "Клиент записался к вам на завтра",
    "type": "booking_created",
    "url": "/bookings"
  }'
```

### Пример ответа (успех)

```json
{
  "success": true,
  "message": "Push notification sent to 2 device(s)",
  "sent": 2,
  "failed": 0,
  "results": [
    {
      "success": true,
      "subscriptionId": "sub-id-1",
      "endpoint": "https://fcm.googleapis.com/fcm/send/..."
    },
    {
      "success": true,
      "subscriptionId": "sub-id-2",
      "endpoint": "https://updates.push.services.mozilla.com/..."
    }
  ]
}
```

### Пример ответа (нет подписок)

```json
{
  "success": false,
  "message": "No push subscriptions found for this user",
  "sent": 0
}
```

## Переменные окружения

Необходимо установить в Supabase Dashboard → Edge Functions → Settings:

| Переменная | Описание |
|------------|----------|
| VAPID_PUBLIC_KEY | Публичный VAPID ключ |
| VAPID_PRIVATE_KEY | Приватный VAPID ключ |
| VAPID_EMAIL | Email для VAPID (mailto:admin@example.com) |
| SUPABASE_URL | Автоматически устанавливается |
| SUPABASE_SERVICE_ROLE_KEY | Автоматически устанавливается |

## Деплой

```bash
# Установите секреты
supabase secrets set VAPID_PUBLIC_KEY=your_public_key
supabase secrets set VAPID_PRIVATE_KEY=your_private_key
supabase secrets set VAPID_EMAIL=mailto:admin@your-domain.com

# Деплой функции
supabase functions deploy send-push-notification
```

## Локальная разработка

```bash
# Запуск локально
supabase functions serve send-push-notification

# Тестирование
curl -X POST 'http://localhost:54321/functions/v1/send-push-notification' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"userId": "...", "title": "Test", "message": "Testing"}'
```

## Логи

```bash
# Просмотр логов
supabase functions logs send-push-notification

# Real-time логи
supabase functions logs send-push-notification --follow
```

## Обработка ошибок

Функция автоматически:

1. **Удаляет недействительные подписки** (статус 410 или 404)
2. **Логирует ошибки** в консоль
3. **Возвращает детальный отчет** о доставке каждого уведомления

## Интеграция с базой данных

Функция вызывается автоматически через триггер при создании записи в таблице `notifications`:

```sql
-- Триггер настроен в docs/PUSH_TRIGGER_MIGRATION.sql
CREATE TRIGGER on_notification_created_send_push
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_push_notification_trigger();
```

## Зависимости

- `deno.land/std@0.168.0/http/server.ts` - HTTP сервер
- `@supabase/supabase-js@2` - Supabase клиент
- `web-push@3.6.6` - Web Push библиотека

## Безопасность

- ✅ Использует Service Role Key для доступа к подпискам
- ✅ CORS настроен для всех origins
- ✅ Валидация входных данных
- ✅ VAPID ключи хранятся в секретах

## Производительность

- Параллельная отправка на все устройства
- Автоматическая очистка недействительных подписок
- Асинхронная обработка ошибок

## Стоимость

- Первые 500K вызовов в месяц - бесплатно
- Далее $2 за 1M вызовов
- [Подробнее о ценах](https://supabase.com/docs/guides/functions/pricing)

