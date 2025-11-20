# 🔐 Безопасное хранение service_role_key через Supabase Vault

## Текущее состояние

✅ **Push-уведомления работают** с хардкод ключом в функции  
⚠️ **Рекомендация:** Переместить ключ в Vault для безопасности

---

## Опция 1: Оставить как есть (быстро, работает)

Текущая реализация использует хардкод `service_role_key` в функции БД. Это **работает**, но:

**Плюсы:**
- ✅ Не требует дополнительной настройки
- ✅ Работает сразу после миграции
- ✅ Простая отладка

**Минусы:**
- ⚠️ Ключ видно в коде функции (через `pg_get_functiondef`)
- ⚠️ Нужно обновлять функцию при ротации ключей

**Вердикт:** Подходит для разработки и MVP. Для продакшена лучше использовать Vault.

---

## Опция 2: Использовать Supabase Vault (рекомендуется для продакшена)

### Шаг 1: Создать секрет в Vault

```sql
-- В Supabase SQL Editor выполните:
SELECT vault.create_secret(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibG92dnFvbHRhc2Jid3pyamxiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjA0NzE3MCwiZXhwIjoyMDQ3NjIzMTcwfQ.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibG92dnFvbHRhc2Jid3pyamxiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjA0NzE3MCwiZXhwIjoyMDQ3NjIzMTcwfQ',
  'service_role_key',
  'Service role key for push notifications'
);
```

### Шаг 2: Проверить, что секрет создан

```sql
SELECT name, description, created_at 
FROM vault.secrets 
WHERE name = 'service_role_key';
```

### Шаг 3: Готово!

Функция `send_push_notification_trigger()` уже настроена для работы с Vault:
- Сначала пытается получить ключ из Vault
- Если не найден, использует хардкод (fallback)

---

## Проверка работы

### Тест 1: Создать уведомление

```sql
-- Замените user_id на свой (из push_subscriptions)
INSERT INTO notifications (user_id, title, message, type)
VALUES (
  'b782e190-89e7-453d-a5cb-ce2f25ba33dc',
  'Тест pg_net',
  'Проверка асинхронной отправки',
  'booking_created'
);
```

### Тест 2: Проверить логи

```sql
-- Смотрим NOTICE из функции
-- Должно быть: "Push notification queued with request_id: ..."
```

### Тест 3: Проверить Edge Function логи

**Supabase Dashboard** → Edge Functions → send-push-notification → Logs

Должны увидеть:
```
✅ Successfully sent to endpoint: https://fcm.googleapis.com/...
```

---

## pg_net: Преимущества

✅ **Асинхронность** - не блокирует транзакцию INSERT  
✅ **Retry логика** - pg_net повторяет неудачные запросы  
✅ **Не требует настройки параметров БД**  
✅ **Рекомендуется Supabase**  

---

## Миграция с http extension на pg_net

✅ **Выполнено автоматически**

Старая версия (http extension):
- ❌ Требовала `ALTER DATABASE` (нет прав)
- ❌ Синхронная (блокирует транзакцию)

Новая версия (pg_net):
- ✅ Не требует настройки параметров
- ✅ Асинхронная
- ✅ Работает сразу

---

## FAQ

**Q: Безопасно ли хранить ключ в функции?**  
A: Для разработки - да. Для продакшена лучше использовать Vault.

**Q: Как обновить ключ, если он скомпрометирован?**  
A: 
- С хардкодом: перезапустить миграцию с новым ключом
- С Vault: обновить секрет через `vault.create_secret` (перезапишет старый)

**Q: Можно ли увидеть ключ в коде функции?**  
A: Да, через `SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'send_push_notification_trigger'`. Поэтому для продакшена рекомендуется Vault.

**Q: Нужно ли что-то менять в клиентском коде?**  
A: Нет, клиентский код остается без изменений. Изменился только способ вызова Edge Function на уровне БД.

---

## Итог

**Для MVP/разработки:**
- ✅ Всё уже работает с хардкодом
- ✅ Ничего настраивать не нужно

**Для продакшена (опционально):**
- 🔐 Создайте секрет в Vault (1 SQL команда выше)
- 🔐 Функция автоматически переключится на Vault

**Приоритет:** Низкий (работает и так)

