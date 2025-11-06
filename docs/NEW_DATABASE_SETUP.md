# 🗄️ Настройка новой базы данных Looking

Эта инструкция для создания **новой** базы данных с нуля.

---

## Шаг 1: Создание проекта в Supabase

1. Перейдите на https://supabase.com
2. Войдите или зарегистрируйтесь
3. Нажмите **"New Project"**
4. Заполните данные:
   - **Name**: `Looking`
   - **Database Password**: придумайте надежный пароль (сохраните!)
   - **Region**: ближайший к вашему местоположению (например, Frankfurt для Европы)
5. Нажмите **"Create new project"**
6. Дождитесь создания проекта (~2 минуты)

---

## Шаг 2: Выполнение SQL миграции

### 2.1. Откройте SQL Editor

1. В левом меню Supabase Dashboard найдите **SQL Editor**
2. Нажмите **"New Query"**

### 2.2. Выполните миграцию

1. Откройте файл `supabase-migration.sql` в корне проекта
2. Скопируйте **весь** SQL код
3. Вставьте в SQL Editor в Supabase
4. Нажмите **"Run"** (или `Ctrl+Enter`)

### 2.3. Проверка выполнения

Вы должны увидеть:
```
Success. No rows returned
```

**Что создалось:**
- ✅ Таблица `profiles` - профили пользователей
- ✅ Таблица `stylists` - профили стилистов с геолокацией
- ✅ Таблица `bookings` - бронирования встреч
- ✅ Таблица `notifications` - уведомления
- ✅ Все RLS политики
- ✅ Триггеры для автоматизации
- ✅ Индексы для производительности

---

## Шаг 3: Включение Real-time

Для мгновенного обновления данных на карте:

1. Перейдите в **Database** → **Replication**
2. Найдите таблицы:
   - `stylists`
   - `bookings`
   - `notifications`
3. Включите переключатель **"Enable replication"** для каждой

---

## Шаг 4: Получение API ключей

### 4.1. Найдите ключи

1. Перейдите в **Settings** → **API**
2. Найдите секцию **"Project API keys"**

### 4.2. Скопируйте нужные значения

Вам нужны:
- **Project URL** (например: `https://abcdefgh.supabase.co`)
- **anon public** key (длинный JWT токен, начинается с `eyJ...`)

---

## Шаг 5: Настройка переменных окружения

### 5.1. Создайте файл .env

В корне проекта `looking-app/` создайте файл `.env`:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5.2. Замените значения

**Важно!** Замените:
- `https://your-project.supabase.co` → ваш Project URL из шага 4
- `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` → ваш anon key из шага 4

---

## Шаг 6: Настройка Email Authentication

1. Перейдите в **Authentication** → **Providers**
2. Убедитесь, что **Email** включен (должен быть включен по умолчанию)
3. (Опционально) Настройте шаблоны писем в **Email Templates**

---

## Шаг 7: Проверка настройки

### 7.1. Запустите приложение

```bash
cd looking-app
npx expo start
```

### 7.2. Тестирование

1. **Регистрация**
   - Откройте вкладку "Регистрация"
   - Выберите роль "Стилист"
   - Заполните email, имя, пароль
   - Нажмите "Зарегистрироваться"

2. **Проверка в Supabase**
   - Перейдите в **Table Editor** → **profiles**
   - Должен появиться новый профиль
   - Перейдите в **Table Editor** → **stylists**
   - Должна быть запись со статусом `available`

3. **Проверка на карте**
   - Выйдите из аккаунта стилиста
   - Зарегистрируйте нового пользователя с ролью "Клиент"
   - Откройте карту
   - Вы должны увидеть маркер созданного стилиста!

---

## Что создается автоматически

### При регистрации любого пользователя:
- Запись в таблице `profiles` с email, именем и ролью

### При регистрации стилиста:
- Запись в таблице `stylists` с параметрами:
  - **bio**: "Новый стилист на платформе"
  - **status**: `available` (сразу виден в списке!)
  - **latitude/longitude**: 55.7558, 37.6173 (центр Москвы)
  - **current_mall**: "Не указан"
  - **portfolio_images**: пустой массив

### При создании бронирования:
- Уведомление для стилиста о новом запросе

### При изменении статуса бронирования:
- Уведомление для клиента о подтверждении/отклонении

---

## Структура базы данных

Подробная схема базы данных: [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md)

### Основные таблицы:

**`profiles`** - Все пользователи
- id, email, full_name, avatar_url, role, created_at

**`stylists`** - Данные стилистов
- id, user_id, bio, portfolio_images, status, latitude, longitude, current_mall

**`bookings`** - Записи к стилистам
- id, client_id, stylist_id, booking_date, booking_time, mall, comment, status

**`notifications`** - Уведомления
- id, user_id, title, message, type, related_booking_id, is_read

---

## Troubleshooting

### ❌ Ошибка "relation 'profiles' does not exist"
**Причина:** Миграция не выполнена или выполнена с ошибками  
**Решение:**
1. Перейдите в SQL Editor
2. Выполните миграцию заново
3. Проверьте логи на наличие ошибок

### ❌ Ошибка "Invalid API key"
**Причина:** Неправильные ключи в `.env`  
**Решение:**
1. Проверьте, что `.env` создан в папке `looking-app/`
2. Убедитесь, что ключи скопированы полностью
3. Перезапустите: `npx expo start -c`

### ❌ Стилисты не отображаются на карте
**Причина:** Real-time не включен или нет стилистов  
**Решение:**
1. Включите Replication для таблицы `stylists`
2. Создайте тестового стилиста (зарегистрируйтесь как стилист)
3. Обновите приложение

### ❌ Пользователь не создается при регистрации
**Причина:** Триггер не создан  
**Решение:**
1. Проверьте в SQL Editor:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
2. Если пусто, выполните миграцию заново

### ❌ RLS ошибки (Row Level Security)
**Причина:** Политики не созданы  
**Решение:**
1. Перейдите в **Authentication** → **Policies**
2. Проверьте наличие политик для всех таблиц
3. Если нет, выполните миграцию заново

---

## Следующие шаги

После успешной настройки:

1. ✅ Создайте несколько тестовых стилистов
2. ✅ Протестируйте бронирование
3. ✅ Проверьте уведомления
4. ✅ Убедитесь, что Real-time обновления работают
5. 📱 Соберите APK для тестирования

---

## Полезные SQL запросы

### Просмотреть всех стилистов
```sql
SELECT s.*, p.full_name, p.email 
FROM stylists s 
JOIN profiles p ON s.user_id = p.id;
```

### Просмотреть все бронирования
```sql
SELECT 
  b.*,
  c.full_name as client_name,
  s_profile.full_name as stylist_name
FROM bookings b
JOIN profiles c ON b.client_id = c.id
JOIN stylists s ON b.stylist_id = s.id
JOIN profiles s_profile ON s.user_id = s_profile.id
ORDER BY b.created_at DESC;
```

### Просмотреть непрочитанные уведомления
```sql
SELECT * FROM notifications 
WHERE is_read = false 
ORDER BY created_at DESC;
```

### Обновить статус всех стилистов
```sql
UPDATE stylists SET status = 'available';
```

---

## 🎉 Готово!

База данных настроена и готова к работе!

Приложение автоматически:
- ✅ Создает профили при регистрации
- ✅ Создает стилистов со статусом 'available'
- ✅ Отправляет уведомления при бронировании
- ✅ Обновляет данные в реальном времени

**Следующий шаг:** [Быстрый старт приложения](./QUICKSTART.md)

