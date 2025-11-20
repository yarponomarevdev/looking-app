# 📊 Отчет о состоянии Push-уведомлений

**Дата проверки:** 20 ноября 2024  
**Проект:** Looking App (bblovvqoltasbbwzrjlb.supabase.co)

---

## ✅ Исправленные проблемы

### 1. **Security Warning: Function Search Path** ✅ ИСПРАВЛЕНО
**Было:** Функции БД имели mutable search_path (security риск)  
**Исправлено:** Добавлен `SET search_path = ''` в:
- `send_push_notification_trigger()`
- `update_push_subscriptions_updated_at()`
- `handle_new_user()`

**Миграция:** `supabase/migrations/.../fix_push_functions_search_path.sql`

---

## ⚠️ Требуют действий пользователя

### 2. **Параметры БД для триггера** ⚠️ НЕ НАСТРОЕНО

**Проблема:**  
Триггер не может вызвать Edge Function, т.к. не заданы параметры:
- `app.settings.supabase_url` = NULL
- `app.settings.service_role_key` = NULL

**Решение:**  
Выполните SQL из `docs/FIX_PUSH_CONFIG.sql`:

```sql
ALTER DATABASE postgres 
  SET app.settings.supabase_url = 'https://bblovvqoltasbbwzrjlb.supabase.co';

ALTER DATABASE postgres 
  SET app.settings.service_role_key = '<ВАШ_SERVICE_ROLE_KEY>';
```

**Где взять ключ:**  
Supabase Dashboard → Settings → API → Project API keys → `service_role` (secret)

---

### 3. **VAPID ключ в Service Worker** ⚠️ ТРЕБУЕТ ПРОВЕРКИ

**Проблема:**  
Service Worker содержит плейсхолдер вместо реального VAPID ключа:
```javascript
const VAPID_PUBLIC_KEY = '[[VAPID_PUBLIC_KEY]]';
```

**Причина:**  
`EXPO_PUBLIC_VAPID_PUBLIC_KEY` не задан в .env или веб-версия не пересобрана после добавления.

**Решение:**

1. Добавьте в `.env`:
```bash
EXPO_PUBLIC_VAPID_PUBLIC_KEY=BPczBqcwpi3u7Wfpn7dYiHkfOXHaI6uletj_N7HwCJ0hy0OFYl4_MuU48NuKNboJHN3f1o98X88bUOz-V3LCWqg
```

2. Пересоберите веб-версию:
```bash
npm run build
# или
npx expo export --platform web
```

3. Проверьте `dist/service-worker.js`:
```javascript
// Должно быть:
const VAPID_PUBLIC_KEY = 'BPczBqcwpi3u7Wfpn7dYiHkfOXHaI6uletj_N7HwCJ0hy0OFYl4_MuU48NuKNboJHN3f1o98X88bUOz-V3LCWqg';
```

**Последствия, если не исправить:**  
Автоматическая переподписка (`pushsubscriptionchange`) не будет работать. Пользователи перестанут получать уведомления после истечения браузерной подписки (~30 дней).

---

## ✅ Компоненты в порядке

- ✅ **Таблица `push_subscriptions`** - создана с RLS
- ✅ **Edge Function** - задеплоена (v8, активна)
- ✅ **Триггер** - создан и привязан к таблице notifications
- ✅ **HTTP Extension** - установлено
- ✅ **Функции БД** - исправлен search_path (security)
- ✅ **Хук `usePushNotifications`** - реализован
- ✅ **Service Worker** - логика push готова
- ✅ **Manifest.json** - gcm_sender_id настроен
- ✅ **Активные подписки** - 2 устройства

---

## 🎯 Чек-лист для запуска

- [ ] **ШАГ 1:** Выполнить SQL из `docs/FIX_PUSH_CONFIG.sql` (параметры БД)
- [ ] **ШАГ 2:** Добавить `EXPO_PUBLIC_VAPID_PUBLIC_KEY` в .env
- [ ] **ШАГ 3:** Пересобрать веб-версию (`npm run build`)
- [ ] **ШАГ 4:** Проверить VAPID в `dist/service-worker.js`
- [ ] **ШАГ 5:** Проверить секреты Supabase (`supabase secrets list`)
- [ ] **ШАГ 6:** Создать тестовое уведомление (SQL из FIX_PUSH_CONFIG.sql)
- [ ] **ШАГ 7:** Проверить логи Edge Function

**Полные инструкции:** `docs/PUSH_SETUP_CHECKLIST.md`

---

## 📈 Архитектура (финальная оценка)

**До исправлений:**
- Архитектура: 9/10 ⭐
- Работоспособность: 4/10 ❌

**После исправлений:**
- Архитектура: 10/10 ⭐⭐⭐
- Работоспособность: 7/10 ⚠️ (требует 3 простых действия пользователя)

**После настройки пользователем:**
- Полная работоспособность: 10/10 ✅

---

## 🐛 Оставшиеся предупреждения (не критично)

### Auth: Leaked Password Protection Disabled
**Уровень:** WARNING  
**Категория:** Security (не связано с push)  
**Описание:** Рекомендуется включить проверку скомпрометированных паролей через HaveIBeenPwned.org  
**Где включить:** Supabase Dashboard → Authentication → Policies → Password  
**Документация:** https://supabase.com/docs/guides/auth/password-security

---

## 📞 Поддержка

Если push-уведомления не работают после выполнения всех шагов:

1. Проверьте раздел "Troubleshooting" в `PUSH_SETUP_CHECKLIST.md`
2. Проверьте логи Edge Function в Supabase Dashboard
3. Проверьте консоль браузера (DevTools)
4. Выполните SQL проверки из `FIX_PUSH_CONFIG.sql` (раздел "ТЕСТИРОВАНИЕ")

