# Настройка Push-уведомлений для PWA

## Обзор

Push-уведомления позволяют получать уведомления в реальном времени, даже когда приложение закрыто. Работают только в веб-версии (PWA).

## Шаги настройки

### 1. Создание VAPID ключей

VAPID ключи необходимы для безопасной аутентификации push-уведомлений.

```bash
# Установите web-push (если еще не установлен)
npm install -g web-push

# Сгенерируйте ключи
npx web-push generate-vapid-keys
```

Вы получите два ключа:
- **Public Key** - добавьте в `.env` как `EXPO_PUBLIC_VAPID_PUBLIC_KEY`
- **Private Key** - добавьте в `.env` как `VAPID_PRIVATE_KEY` (НЕ коммитьте!)

### 2. Создание таблицы в Supabase

Выполните SQL миграцию из файла `docs/PUSH_SUBSCRIPTIONS_MIGRATION.sql` в Supabase Dashboard:

1. Откройте **SQL Editor** в Supabase
2. Скопируйте содержимое `PUSH_SUBSCRIPTIONS_MIGRATION.sql`
3. Выполните запрос

Это создаст:
- Таблицу `push_subscriptions` для хранения подписок
- RLS политики для безопасности
- Индексы для производительности

### 3. Настройка Edge Function для отправки уведомлений

Создайте Edge Function в Supabase для отправки push-уведомлений:

```typescript
// supabase/functions/send-push-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import * as webpush from 'npm:web-push'

const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidPublicKey,
  vapidPrivateKey
)

serve(async (req) => {
  try {
    const { userId, title, message, type, url } = await req.json()

    // Получаем подписки пользователя
    const { data: subscriptions } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ error: 'No subscriptions found' }), {
        status: 404,
      })
    }

    // Отправляем уведомление на все устройства
    const promises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      }

      const payload = JSON.stringify({
        title,
        message,
        type,
        url,
      })

      try {
        await webpush.sendNotification(pushSubscription, payload)
        return { success: true, endpoint: sub.endpoint }
      } catch (error) {
        // Если подписка недействительна, удаляем её
        if (error.statusCode === 410) {
          await supabaseAdmin
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint)
        }
        return { success: false, endpoint: sub.endpoint, error: error.message }
      }
    })

    const results = await Promise.all(promises)

    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    })
  }
})
```

### 4. Интеграция с системой уведомлений

Обновите триггеры в Supabase для автоматической отправки push-уведомлений:

```sql
-- Функция для отправки push-уведомления при создании записи в notifications
CREATE OR REPLACE FUNCTION send_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_url TEXT;
BEGIN
  -- Определяем URL в зависимости от типа уведомления
  notification_url := CASE
    WHEN NEW.related_booking_id IS NOT NULL THEN '/bookings'
    ELSE '/notifications'
  END;

  -- Вызываем Edge Function для отправки push
  PERFORM net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'token'
    ),
    body := jsonb_build_object(
      'userId', NEW.user_id,
      'title', NEW.title,
      'message', NEW.message,
      'type', NEW.type,
      'url', notification_url
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер на создание уведомления
CREATE TRIGGER on_notification_created
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_push_notification();
```

### 5. Развертывание Service Worker

Service Worker уже создан в `public/service-worker.js`. При деплое на Vercel/Netlify убедитесь, что:

1. Файл `service-worker.js` доступен по пути `/service-worker.js`
2. В заголовках ответа установлен `Service-Worker-Allowed: /`

Для Vercel добавьте в `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/service-worker.js",
      "headers": [
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

## Тестирование

### Локальное тестирование

1. Запустите приложение: `npm run web`
2. Откройте в браузере с поддержкой PWA (Chrome, Edge)
3. Зарегистрируйтесь/войдите
4. Разрешите уведомления когда появится промпт
5. Создайте тестовое уведомление через Supabase Dashboard:

```sql
INSERT INTO notifications (user_id, type, title, message)
VALUES ('your-user-id', 'test', 'Тест', 'Тестовое уведомление');
```

### Проверка подписки

Проверьте в DevTools → Application → Service Workers, что Service Worker зарегистрирован.

Проверьте в таблице `push_subscriptions`, что подписка создана.

## Возможные проблемы

### Push не работает в Safari

Safari на iOS не поддерживает Web Push API. Только Chrome, Edge, Firefox на Desktop и Android.

### Service Worker не регистрируется

- Убедитесь, что используете HTTPS (или localhost)
- Проверьте путь к `service-worker.js`
- Посмотрите ошибки в Console

### Уведомления не приходят

1. Проверьте права в браузере (chrome://settings/content/notifications)
2. Проверьте подписку в БД
3. Проверьте логи Edge Function
4. Убедитесь, что VAPID ключи правильные

## Полезные ссылки

- [Web Push API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [VAPID Documentation](https://tools.ietf.org/html/rfc8292)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

