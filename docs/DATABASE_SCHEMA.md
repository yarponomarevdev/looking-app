# Схема базы данных Looking

Этот документ описывает структуру базы данных приложения Looking.

---

## Таблицы

### 1. `profiles` - Профили пользователей

Основная таблица для хранения информации о всех пользователях системы.

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | UUID | PRIMARY KEY, ссылка на `auth.users` |
| `email` | TEXT | Email пользователя |
| `full_name` | TEXT | Полное имя |
| `avatar_url` | TEXT | URL аватара |
| `role` | TEXT | Роль: 'client' или 'stylist' |
| `created_at` | TIMESTAMP | Время создания |

**Особенности:**
- Автоматически создается при регистрации через триггер `on_auth_user_created`
- RLS включен: все могут видеть профили, редактировать только свой

---

### 2. `stylists` - Профили стилистов

Дополнительная информация о стилистах с геолокацией.

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | UUID | PRIMARY KEY |
| `user_id` | UUID | UNIQUE, ссылка на `profiles.id` |
| `bio` | TEXT | Биография стилиста |
| `portfolio_images` | TEXT[] | Массив URL фотографий портфолио |
| `status` | TEXT | 'available', 'busy', 'offline' |
| `latitude` | DOUBLE PRECISION | Широта текущего местоположения |
| `longitude` | DOUBLE PRECISION | Долгота текущего местоположения |
| `current_mall` | TEXT | Название текущего ТЦ |
| `created_at` | TIMESTAMP | Время создания |
| `updated_at` | TIMESTAMP | Время последнего обновления |

**Особенности:**
- Автоматически создается для пользователей с role='stylist'
- Дефолтный статус: 'available' (видны в списке сразу после регистрации)
- RLS включен: все видят, редактировать только свой профиль
- Индексы: по `status` и `user_id`

**Примечание:** Поле `rating` было удалено из схемы.

---

### 3. `bookings` - Бронирования встреч

Хранит информацию о записях клиентов к стилистам.

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | UUID | PRIMARY KEY |
| `client_id` | UUID | NOT NULL, ссылка на `profiles.id` |
| `stylist_id` | UUID | NOT NULL, ссылка на `stylists.id` |
| `booking_date` | DATE | Дата встречи |
| `booking_time` | TIME | Время встречи |
| `mall` | TEXT | Место встречи (ТЦ) |
| `comment` | TEXT | Комментарий клиента |
| `status` | TEXT | 'pending', 'confirmed', 'rejected', 'completed' |
| `created_at` | TIMESTAMP | Время создания |
| `updated_at` | TIMESTAMP | Время последнего обновления |

**Особенности:**
- Клиенты могут создавать бронирования (INSERT)
- Стилисты могут изменять статус на confirmed/rejected/completed
- Клиенты могут отменять свои pending бронирования
- Индексы: по `client_id`, `stylist_id`, `status`, `booking_date`

---

### 4. `notifications` - Уведомления

Система уведомлений для пользователей.

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | UUID | PRIMARY KEY |
| `user_id` | UUID | NOT NULL, ссылка на `profiles.id` |
| `title` | TEXT | Заголовок уведомления |
| `message` | TEXT | Текст уведомления |
| `type` | TEXT | 'booking_created', 'booking_confirmed', 'booking_rejected' |
| `related_booking_id` | UUID | Ссылка на связанное бронирование |
| `is_read` | BOOLEAN | Прочитано ли (default: false) |
| `created_at` | TIMESTAMP | Время создания |

**Особенности:**
- Создаются автоматически через триггеры:
  - При создании бронирования → уведомление стилисту
  - При изменении статуса → уведомление клиенту
- RLS: пользователи видят только свои уведомления
- Индексы: по `user_id`, `is_read`, `created_at`

---

## Триггеры

### 1. `on_auth_user_created`
**Таблица:** `auth.users`  
**Событие:** AFTER INSERT  
**Функция:** `handle_new_user()`

**Действия:**
1. Создает запись в `profiles` с данными из `raw_user_meta_data`
2. Если role='stylist', создает запись в `stylists` со значениями по умолчанию:
   - status: 'available'
   - latitude/longitude: 55.7558, 37.6173 (Москва)
   - current_mall: "Не указан"
   - bio: "Новый стилист на платформе"

### 2. `on_booking_created`
**Таблица:** `bookings`  
**Событие:** AFTER INSERT  
**Функция:** `notify_booking_created()`

**Действия:**
- Создает уведомление для стилиста о новом запросе на встречу

### 3. `on_booking_status_changed`
**Таблица:** `bookings`  
**Событие:** AFTER UPDATE  
**Функция:** `notify_booking_status_changed()`

**Действия:**
- При изменении статуса на 'confirmed' или 'rejected' создает уведомление для клиента

### 4. `update_stylists_updated_at` и `update_bookings_updated_at`
**Таблицы:** `stylists`, `bookings`  
**Событие:** BEFORE UPDATE  
**Функция:** `update_updated_at_column()`

**Действия:**
- Автоматически обновляет поле `updated_at` при изменении записи

---

## Row Level Security (RLS)

### `profiles`
- ✅ **SELECT**: Все могут видеть
- ✅ **UPDATE**: Только владелец профиля
- ✅ **INSERT**: Только для своего ID

### `stylists`
- ✅ **SELECT**: Все могут видеть
- ✅ **UPDATE**: Только владелец профиля
- ✅ **INSERT**: Только для своего user_id

### `bookings`
- ✅ **SELECT**: Клиент видит свои, стилист видит к себе
- ✅ **INSERT**: Только клиент для себя
- ✅ **UPDATE**: 
  - Клиент может отменить pending бронирование
  - Стилист может изменить статус на confirmed/rejected/completed

### `notifications`
- ✅ **SELECT**: Только свои уведомления
- ✅ **INSERT**: Система (через service role)
- ✅ **UPDATE**: Только свои уведомления

---

## Real-time подписки

Приложение использует Supabase Real-time для следующих таблиц:

1. **`stylists`** - для обновления позиций и статусов на карте
2. **`bookings`** - для мгновенного обновления списка бронирований
3. **`notifications`** - для показа новых уведомлений

**Настройка:**  
В Supabase Dashboard → Database → Replication включите Real-time для этих таблиц.

---

## Индексы

Созданы для оптимизации частых запросов:

```sql
-- Стилисты
CREATE INDEX idx_stylists_status ON stylists(status);
CREATE INDEX idx_stylists_user_id ON stylists(user_id);

-- Бронирования
CREATE INDEX idx_bookings_client_id ON bookings(client_id);
CREATE INDEX idx_bookings_stylist_id ON bookings(stylist_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(booking_date);

-- Уведомления
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

---

## Развертывание

Для создания базы данных выполните файл `supabase-migration.sql` в Supabase Dashboard → SQL Editor.

Подробная инструкция: [`docs/SUPABASE_SETUP.md`](./SUPABASE_SETUP.md)

---

## Изменения в схеме

### Удалено
- ❌ Поле `rating` из таблицы `stylists` (функционал рейтинга удален)

### Изменено
- ✏️ Дефолтный статус стилистов изменен с 'offline' на 'available'

