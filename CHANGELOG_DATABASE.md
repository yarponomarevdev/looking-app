# 📋 Changelog - Обновление базы данных Looking

## Дата изменений
Ноябрь 2025

---

## ✅ Что было сделано

### 1. Переделана SQL миграция для новой БД

**Файл:** `supabase-migration.sql`

**Изменения:**
- ❌ Удалена секция "Обновление существующих стилистов" (UPDATE и ALTER команды)
- ✅ Оставлены только команды CREATE для чистой установки
- ✅ Убрано поле `rating` из таблицы `stylists`
- ✅ Дефолтный статус стилистов теперь `'available'` вместо `'offline'`

**Результат:** Миграция теперь создает БД с нуля без необходимости обновления.

---

### 2. Удален функционал рейтинга

**Причина:** Упрощение MVP

**Изменения в коде (8 файлов):**
- `src/types/index.ts` - удалено поле `rating` из интерфейса `Stylist`
- `src/store/stylistStore.ts` - убраны запросы и маппинг рейтинга
- `src/store/bookingStore.ts` - убраны запросы и маппинг рейтинга
- `src/screens/StylistListScreen.tsx` - удалено отображение звездочек
- `src/screens/StylistDetailScreen.tsx` - удалено отображение рейтинга
- `src/screens/StylistBookingsScreen.tsx` - удалено поле рейтинга
- `src/components/map/StylistBottomSheet.tsx` - удалено из Bottom Sheet
- `src/components/booking/BookingCard.tsx` - удалено из карточек

**Изменения в БД:**
- Удалена колонка `rating DECIMAL(3,1)` из таблицы `stylists`
- Удалено ограничение `CHECK (rating >= 0 AND rating <= 5)`

**Теперь стилисты показываются с:**
- Имя
- Статус (Свободен/Занят)
- Текущий ТЦ
- Био
- Портфолио

---

### 3. Исправлена проблема с отображением новых стилистов

**Проблема:** Новые стилисты не отображались в списке после регистрации

**Причина:** Создавались со статусом `'offline'`, а загружались только `'available'` и `'busy'`

**Решение:** Изменен дефолтный статус на `'available'` в триггере `handle_new_user()`

**Результат:** Все новые стилисты сразу видны на карте и в списке

---

### 4. Обновлена документация (6 файлов)

#### Удалены устаревшие инструкции:
- ❌ `QUICK_UPDATE_RATING.sql` - команды для обновления существующей БД
- ❌ `docs/FIX_STYLIST_STATUS.md` - исправление статуса (больше не нужно)
- ❌ `docs/REMOVE_RATING_FEATURE.md` - удаление рейтинга (уже удален)

#### Созданы новые:
- ✅ `docs/DATABASE_SCHEMA.md` - полная схема БД с описанием
- ✅ `docs/NEW_DATABASE_SETUP.md` - пошаговая настройка новой БД

#### Обновлены существующие:
- ✅ `docs/SUPABASE_SETUP.md` - убрано упоминание рейтинга, добавлена информация об автоматическом создании стилистов
- ✅ `docs/QUICKSTART.md` - обновлена инструкция по созданию тестовых стилистов
- ✅ `docs/IMPLEMENTATION_STATUS.md` - обновлена информация о Яндекс.Картах, убрано про Google Maps

---

## 📊 Итоговая структура БД

### Таблицы:

1. **profiles** - Профили всех пользователей
   - Поля: id, email, full_name, avatar_url, role, created_at

2. **stylists** - Данные стилистов
   - Поля: id, user_id, bio, portfolio_images, status, latitude, longitude, current_mall, created_at, updated_at
   - **Без поля rating!**

3. **bookings** - Записи к стилистам
   - Поля: id, client_id, stylist_id, booking_date, booking_time, mall, comment, status, created_at, updated_at

4. **notifications** - Уведомления
   - Поля: id, user_id, title, message, type, related_booking_id, is_read, created_at

### Триггеры:

- `on_auth_user_created` - создает профиль и стилиста при регистрации
- `on_booking_created` - создает уведомление стилисту
- `on_booking_status_changed` - создает уведомление клиенту
- `update_stylists_updated_at` - обновляет поле updated_at
- `update_bookings_updated_at` - обновляет поле updated_at

---

## 🚀 Как использовать

### Для новой базы данных:
1. Выполните `supabase-migration.sql` в Supabase Dashboard → SQL Editor
2. Следуйте инструкции [`docs/NEW_DATABASE_SETUP.md`](./docs/NEW_DATABASE_SETUP.md)

### Дополнительная документация:
- **Схема БД**: [`docs/DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md)
- **Быстрый старт**: [`docs/QUICKSTART.md`](./docs/QUICKSTART.md)
- **Настройка Supabase**: [`docs/SUPABASE_SETUP.md`](./docs/SUPABASE_SETUP.md)

---

## ⚠️ Важно!

Если у вас уже есть работающая база данных и нужно обновить её:

### Для удаления колонки rating:
```sql
ALTER TABLE stylists DROP COLUMN IF EXISTS rating;
```

### Для обновления статусов стилистов:
```sql
UPDATE stylists 
SET status = 'available' 
WHERE status = 'offline';
```

### Для обновления триггера:
```sql
-- Выполните функцию handle_new_user() из supabase-migration.sql
```

---

## 📝 Файлы проекта

### SQL:
- `supabase-migration.sql` - главная миграция для новой БД

### Документация:
- `docs/NEW_DATABASE_SETUP.md` - пошаговая настройка новой БД ⭐
- `docs/DATABASE_SCHEMA.md` - полная схема и описание БД
- `docs/SUPABASE_SETUP.md` - детальная настройка Supabase
- `docs/QUICKSTART.md` - быстрый старт приложения
- `docs/IMPLEMENTATION_STATUS.md` - статус реализации функций

### Исходный код (изменено 8 файлов):
- `src/types/index.ts`
- `src/store/stylistStore.ts`
- `src/store/bookingStore.ts`
- `src/screens/StylistListScreen.tsx`
- `src/screens/StylistDetailScreen.tsx`
- `src/screens/StylistBookingsScreen.tsx`
- `src/components/map/StylistBottomSheet.tsx`
- `src/components/booking/BookingCard.tsx`

---

## ✅ Чек-лист проверки

После применения изменений:

- [ ] SQL миграция выполнена без ошибок
- [ ] Таблицы созданы: profiles, stylists, bookings, notifications
- [ ] Триггеры работают
- [ ] Real-time включен для stylists, bookings, notifications
- [ ] Регистрация стилиста создает запись с status='available'
- [ ] Стилисты отображаются на карте
- [ ] Поле rating нигде не используется
- [ ] Бронирование работает
- [ ] Уведомления приходят

---

## 🎯 Результат

**База данных готова для production!**

- ✅ Чистая схема без легаси
- ✅ Автоматизация через триггеры
- ✅ Real-time обновления
- ✅ RLS политики настроены
- ✅ Функционал рейтинга удален (упрощение MVP)
- ✅ Все стилисты сразу видны после регистрации

---

**Следующий шаг:** [Настройка новой базы данных](./docs/NEW_DATABASE_SETUP.md)

