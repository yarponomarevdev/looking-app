# 🖱️ Ручная настройка Push-уведомлений (без CLI)

Полное руководство по настройке push-уведомлений через Supabase Dashboard **без использования командной строки**.

---

## 📋 Что нужно

- ✅ Аккаунт Supabase
- ✅ Браузер (Chrome, Firefox, Edge)
- ✅ 15 минут времени

---

## 🔑 Шаг 1: Подготовка VAPID ключей

Ключи уже сгенерированы для вашего проекта:

```
Public Key:  BPczBqcwpi3u7Wfpn7dYiHkfOXHaI6uletj_N7HwCJ0hy0OFYl4_MuU48NuKNboJHN3f1o98X88bUOz-V3LCWqg
Private Key: wcjHrruKLGIDv7fgyvPwDgEW-P1UxTPBv238sNaikCk
```

⚠️ **Скопируйте эти ключи** - они понадобятся дальше.

---

## 🗄️ Шаг 2: Создание таблицы подписок

### 2.1 Откройте SQL Editor

1. Откройте ваш проект в [Supabase Dashboard](https://supabase.com/dashboard)
2. В левом меню нажмите **SQL Editor**
3. Нажмите **New Query**

### 2.2 Выполните миграцию таблицы

Скопируйте **весь код** из файла `docs/PUSH_SUBSCRIPTIONS_MIGRATION.sql` и вставьте в SQL Editor:

```sql
-- Создаем таблицу для подписок на push-уведомления
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- RLS политики
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();
```

Нажмите **Run** или `Ctrl+Enter`.

✅ **Результат:** Должно появиться сообщение "Success. No rows returned"

### 2.3 Проверка

В левом меню нажмите **Table Editor**. Вы должны увидеть новую таблицу `push_subscriptions`.

---

## 🚀 Шаг 3: Создание Edge Function

### 3.1 Откройте Edge Functions

1. В левом меню нажмите **Edge Functions**
2. Нажмите **Create a new function**

### 3.2 Заполните форму

**Function name:** `send-push-notification`

**Function code:** Скопируйте **весь код** из файла `supabase/functions/send-push-notification/index.ts`:

<details>
<summary>📄 Код Edge Function (нажмите чтобы развернуть)</summary>

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.6'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!
const vapidEmail = Deno.env.get('VAPID_EMAIL') || 'mailto:admin@example.com'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

webpush.setVapidDetails(
  vapidEmail,
  vapidPublicKey,
  vapidPrivateKey
)

interface PushNotificationRequest {
  userId: string
  title: string
  message: string
  type?: string
  url?: string
}

interface PushSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, title, message, type, url }: PushNotificationRequest = await req.json()

    if (!userId || !title || !message) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: userId, title, message' 
        }), 
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Sending push notification to user: ${userId}`)

    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError)
      throw fetchError
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No push subscriptions found for user: ${userId}`)
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'No push subscriptions found for this user',
          sent: 0,
        }), 
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Found ${subscriptions.length} subscription(s) for user`)

    const payload = JSON.stringify({
      title,
      message,
      body: message,
      type: type || 'notification',
      url: url || '/',
      timestamp: new Date().toISOString(),
    })

    const results = await Promise.all(
      subscriptions.map(async (sub: PushSubscription) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          }

          await webpush.sendNotification(pushSubscription, payload)
          
          console.log(`✅ Successfully sent to endpoint: ${sub.endpoint.substring(0, 50)}...`)
          
          return { 
            success: true, 
            subscriptionId: sub.id,
            endpoint: sub.endpoint.substring(0, 50) + '...',
          }
        } catch (error: any) {
          console.error(`❌ Error sending to endpoint ${sub.endpoint.substring(0, 50)}:`, error.message)
          
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`Removing invalid subscription: ${sub.id}`)
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id)
          }
          
          return { 
            success: false, 
            subscriptionId: sub.id,
            error: error.message,
            statusCode: error.statusCode,
          }
        }
      })
    )

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    console.log(`Notification delivery: ${successCount} succeeded, ${failureCount} failed`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Push notification sent to ${successCount} device(s)`,
        sent: successCount,
        failed: failureCount,
        results,
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error in send-push-notification function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString(),
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
```

</details>

### 3.3 Нажмите Deploy

Функция начнет деплоиться. Это может занять 1-2 минуты.

✅ **Результат:** Статус функции должен стать "Active" (зеленый)

### 3.4 Запомните URL функции

Скопируйте URL функции, он будет вида:
```
https://your-project-ref.supabase.co/functions/v1/send-push-notification
```

---

## 🔐 Шаг 4: Настройка секретов (Environment Variables)

### 4.1 Откройте настройки Edge Functions

1. В левом меню **Edge Functions**
2. Нажмите на вашу функцию `send-push-notification`
3. Перейдите на вкладку **Settings**
4. Прокрутите вниз до раздела **Secrets**

### 4.2 Добавьте секреты

Нажмите **Add Secret** для каждого из трех секретов:

#### Секрет 1: VAPID_PUBLIC_KEY

```
Name:  VAPID_PUBLIC_KEY
Value: BPczBqcwpi3u7Wfpn7dYiHkfOXHaI6uletj_N7HwCJ0hy0OFYl4_MuU48NuKNboJHN3f1o98X88bUOz-V3LCWqg
```

#### Секрет 2: VAPID_PRIVATE_KEY

```
Name:  VAPID_PRIVATE_KEY
Value: wcjHrruKLGIDv7fgyvPwDgEW-P1UxTPBv238sNaikCk
```

#### Секрет 3: VAPID_EMAIL

```
Name:  VAPID_EMAIL
Value: mailto:admin@your-domain.com
```

⚠️ **Важно:** После добавления каждого секрета нажмите **Save**.

### 4.3 Перезапустите функцию

После добавления всех секретов:
1. Вернитесь к списку Edge Functions
2. Нажмите на меню (три точки) возле вашей функции
3. Выберите **Redeploy**

---

## 🔗 Шаг 5: Создание триггера для автоматической отправки

### 5.1 Включите HTTP расширение

В **SQL Editor** выполните:

```sql
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
```

### 5.2 Получите Service Role Key

1. В левом меню **Settings** → **API**
2. Найдите раздел **Project API keys**
3. Скопируйте **service_role** ключ (⚠️ **НЕ anon key!**)

### 5.3 Настройте параметры базы данных

В **SQL Editor** выполните, **заменив** на ваши значения:

```sql
-- ВАЖНО: Замените на ваши реальные значения!
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://YOUR-PROJECT-REF.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY_HERE';
```

**Где найти:**
- `YOUR-PROJECT-REF` - это ID проекта из URL Dashboard (например: `abc123xyz.supabase.co`)
- `YOUR_SERVICE_ROLE_KEY_HERE` - service_role key из Шага 5.2

### 5.4 Создайте триггер

В **SQL Editor** выполните:

```sql
-- Функция для отправки push-уведомления через Edge Function
CREATE OR REPLACE FUNCTION send_push_notification_trigger()
RETURNS TRIGGER AS $$
DECLARE
  notification_url TEXT;
  function_url TEXT;
  service_role_key TEXT;
  response_status INT;
BEGIN
  -- Определяем URL для перехода
  notification_url := CASE
    WHEN NEW.related_booking_id IS NOT NULL THEN '/bookings'
    WHEN NEW.type = 'booking_created' THEN '/bookings'
    WHEN NEW.type = 'booking_confirmed' THEN '/bookings'
    WHEN NEW.type = 'booking_rejected' THEN '/bookings'
    ELSE '/notifications'
  END;

  -- Получаем настройки
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push-notification';
  service_role_key := current_setting('app.settings.service_role_key', true);

  -- Проверяем настройки
  IF function_url IS NULL OR service_role_key IS NULL THEN
    RAISE WARNING 'Supabase URL or Service Role Key not configured. Skipping push notification.';
    RETURN NEW;
  END IF;

  -- Вызываем Edge Function
  BEGIN
    SELECT status INTO response_status
    FROM extensions.http((
      'POST',
      function_url,
      ARRAY[
        extensions.http_header('Content-Type', 'application/json'),
        extensions.http_header('Authorization', 'Bearer ' || service_role_key)
      ],
      'application/json',
      json_build_object(
        'userId', NEW.user_id,
        'title', NEW.title,
        'message', NEW.message,
        'type', NEW.type,
        'url', notification_url
      )::text
    )::extensions.http_request);

    IF response_status >= 200 AND response_status < 300 THEN
      RAISE NOTICE 'Push notification sent successfully for notification %', NEW.id;
    ELSE
      RAISE WARNING 'Push notification failed with status % for notification %', response_status, NEW.id;
    END IF;

  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error sending push notification: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем триггер
DROP TRIGGER IF EXISTS on_notification_created_send_push ON notifications;

CREATE TRIGGER on_notification_created_send_push
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_push_notification_trigger();
```

✅ **Результат:** Триггер создан. Теперь при каждой новой записи в таблице `notifications` будет автоматически отправляться push.

---

## ✅ Шаг 6: Тестирование

### 6.1 Тест функции напрямую

1. Перейдите в **Edge Functions** → `send-push-notification`
2. Перейдите на вкладку **Invoke**
3. Вставьте тестовый JSON (замените `YOUR_USER_UUID` на реальный UUID пользователя):

```json
{
  "userId": "YOUR_USER_UUID",
  "title": "Тест",
  "message": "Проверка push-уведомлений",
  "type": "test",
  "url": "/notifications"
}
```

4. Нажмите **Invoke**

**Ожидаемый результат:**
- Если у пользователя есть подписки: `"success": true, "sent": 1`
- Если нет подписок: `"success": false, "message": "No push subscriptions found"`

### 6.2 Тест через приложение

1. Откройте ваше PWA приложение в Chrome/Edge
2. Войдите в аккаунт
3. Разрешите уведомления когда появится промпт
4. Проверьте подписку в **SQL Editor**:

```sql
SELECT * FROM push_subscriptions WHERE user_id = 'YOUR_USER_UUID';
```

Должна появиться запись с endpoint.

### 6.3 Тест автоматической отправки

В **SQL Editor** создайте тестовое уведомление:

```sql
INSERT INTO notifications (user_id, type, title, message)
VALUES ('YOUR_USER_UUID', 'test', 'Тест', 'Автоматическая отправка работает!');
```

🎉 **Должно прийти push-уведомление на ваше устройство!**

---

## 📊 Проверка настроек

### Проверка таблицы

```sql
SELECT 
  table_name 
FROM information_schema.tables 
WHERE table_name = 'push_subscriptions';
```

Должна вернуться 1 строка.

### Проверка триггера

```sql
SELECT 
  trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'on_notification_created_send_push';
```

Должна вернуться 1 строка.

### Проверка параметров

```sql
SHOW app.settings.supabase_url;
SHOW app.settings.service_role_key;
```

Должны вернуться ваши значения (не пустые).

### Проверка секретов

В **Edge Functions** → `send-push-notification` → **Settings** → **Secrets** должно быть 3 секрета:
- ✅ VAPID_PUBLIC_KEY
- ✅ VAPID_PRIVATE_KEY
- ✅ VAPID_EMAIL

---

## 🔍 Устранение проблем

### Функция возвращает ошибку 500

**Причина:** Не установлены секреты.

**Решение:** Проверьте Шаг 4, добавьте все 3 секрета и сделайте Redeploy.

### "No push subscriptions found"

**Причина:** Пользователь не подписался на уведомления.

**Решение:** Откройте PWA в Chrome, войдите и разрешите уведомления.

### Триггер не вызывается

**Причина:** Неправильно настроены параметры БД.

**Решение:** Проверьте Шаг 5.3, убедитесь что:
- URL правильный (включая `https://`)
- Service Role Key правильный (НЕ anon key!)

### HTTP extension не найден

**Решение:** Выполните Шаг 5.1:
```sql
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
```

---

## 🎯 Чек-лист готовности

- [ ] Таблица `push_subscriptions` создана
- [ ] Edge Function `send-push-notification` задеплоена
- [ ] Секреты добавлены (3 шт)
- [ ] HTTP extension включен
- [ ] Параметры БД настроены (URL и Service Role Key)
- [ ] Триггер создан
- [ ] Тестовая отправка работает ✅

---

## 📚 Дополнительные ресурсы

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Supabase Database Triggers](https://supabase.com/docs/guides/database/postgres/triggers)

---

## 🎉 Готово!

Теперь ваше приложение полностью настроено для отправки push-уведомлений!

При создании новой записи в таблице `notifications` автоматически отправится push всем подписанным пользователям.

**Время настройки:** ~15 минут  
**Сложность:** Легкая (просто следуйте шагам)  
**Результат:** Полностью работающие push-уведомления 🚀

