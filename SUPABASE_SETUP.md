# Настройка Supabase для Looking

## Шаг 1: Создание проекта в Supabase

1. Перейдите на https://supabase.com
2. Войдите или зарегистрируйтесь
3. Нажмите "New Project"
4. Заполните данные:
   - **Name**: Looking
   - **Database Password**: (придумайте надежный пароль и сохраните)
   - **Region**: ближайший к Москве (например, Frankfurt)
5. Нажмите "Create new project"

## Шаг 2: Выполнение SQL миграции

1. В панели Supabase перейдите в **SQL Editor** (слева в меню)
2. Нажмите "New Query"
3. Скопируйте весь SQL код из файла `supabase-migration.sql`
4. Вставьте в редактор и нажмите **Run** (или Ctrl+Enter)
5. Убедитесь, что выполнение прошло без ошибок

## Шаг 3: Получение API ключей

1. В панели Supabase перейдите в **Settings** → **API**
2. Найдите и скопируйте:
   - **Project URL** (например, `https://xxxxx.supabase.co`)
   - **anon public** key (длинный ключ, начинается с `eyJ...`)

## Шаг 4: Настройка переменных окружения

Создайте файл `.env` в корне проекта `looking-app/`:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Важно:** Замените значения на ваши реальные из шага 3!

## Шаг 5: Включение Email Authentication

1. В Supabase перейдите в **Authentication** → **Providers**
2. Убедитесь, что **Email** включен
3. (Опционально) Настройте Email Templates в разделе **Email Templates**

## Шаг 6: Настройка Real-time (для live обновлений)

1. Перейдите в **Database** → **Replication**
2. Найдите таблицу `stylists`
3. Включите переключатель для real-time updates

## Шаг 7: Проверка настройки

Запустите приложение:
```bash
cd looking-app
npx expo start
```

Попробуйте:
1. Зарегистрироваться
2. Войти в систему
3. Проверить, что данные сохраняются в Supabase

## Создание тестового стилиста

После регистрации тестового пользователя:

1. Перейдите в **Table Editor** → **auth.users**
2. Найдите ваш UUID пользователя
3. Перейдите в **stylists** таблицу
4. Нажмите "Insert row" и заполните:
   - `user_id`: ваш UUID
   - `bio`: "Тестовый стилист"
   - `status`: "available"
   - `latitude`: 55.7558
   - `longitude`: 37.6173
   - `current_mall`: "ТЦ Европейский"
   - `rating`: 4.5

Теперь этот стилист появится на карте!

## Troubleshooting

### Ошибка "Invalid API key"
- Проверьте, что `.env` файл создан в правильной директории
- Убедитесь, что ключи скопированы полностью
- Перезапустите Expo: `npx expo start -c`

### Пользователь не создается
- Проверьте, что триггер `on_auth_user_created` создан
- Посмотрите логи в Supabase Dashboard → **Logs**

### Real-time не работает
- Убедитесь, что replication включена для таблицы `stylists`
- Проверьте RLS политики

## Готово! 🎉

Ваш Supabase backend настроен и готов к работе.

