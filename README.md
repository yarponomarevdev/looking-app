# Looking - Мобильное приложение для поиска стилистов

**Looking** — мобильное приложение для поиска и просмотра стилистов в торговых центрах Москвы.

## 📱 Основные функции MVP

- ✅ Карта с Яндекс.Картами (WebView), показывающая активных стилистов в реальном времени
- ✅ Список всех доступных стилистов
- ✅ Детальные профили стилистов с портфолио
- ✅ Авторизация через email/password (Supabase Auth)
- ✅ Личный кабинет пользователя
- ✅ Система бронирования встреч
- ✅ Лента образов (Looks) от стилистов
- ✅ Push-уведомления (PWA)
- ✅ Прогрессивное веб-приложение (PWA) с офлайн-режимом

## 🛠 Технологический стек

- **Frontend**: React Native (Expo)
- **Язык**: TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Карты**: Яндекс.Карты JavaScript API 2.1 (через WebView)
- **Геолокация**: expo-location
- **State Management**: Zustand
- **Навигация**: React Navigation v6
- **UI**: React Native Paper

## 🚀 Быстрый старт

### Требования

- Node.js 18+
- npm или yarn
- Expo Go приложение на телефоне (для тестирования)
- Аккаунт Supabase (бесплатно)
- Яндекс.Карты API ключ (опционально, есть демо-ключ)

### Установка

1. **Клонируйте репозиторий**
```bash
cd looking-app
npm install
```

2. **Настройте Supabase**

Следуйте инструкциям в файле [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

3. **Создайте файл `.env`**

```env
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. **Запустите приложение**

**Мобильная версия:**
```bash
npx expo start
```

**Веб-версия:**
```bash
npm run web
```

**Сборка для продакшена:**
```bash
npm run build
```

Отсканируйте QR код в приложении Expo Go на телефоне.

## 📂 Структура проекта

```
looking-app/
├── src/
│   ├── screens/
│   │   ├── MapScreen.tsx              # Главный экран с картой (WebView)
│   │   ├── StylistListScreen.tsx      # Список стилистов
│   │   ├── StylistDetailScreen.tsx    # Профиль стилиста
│   │   ├── AuthScreen.tsx             # Авторизация
│   │   └── ProfileScreen.tsx          # Личный кабинет
│   ├── lib/
│   │   └── supabase.ts                # Supabase клиент
│   ├── store/
│   │   ├── authStore.ts               # Zustand store для auth
│   │   └── stylistStore.ts            # Store для стилистов
│   ├── types/
│   │   └── index.ts                   # TypeScript типы
│   └── navigation/
│       └── AppNavigator.tsx           # Навигация
├── assets/                            # Иконки и изображения
├── public/                            # Статические файлы для веб
├── scripts/                           # Утилиты и скрипты
├── docs/                              # Документация
├── App.tsx                            # Точка входа
├── app.config.ts                      # Конфигурация Expo
└── supabase-migration.sql             # SQL миграция для БД
```

## 🎨 Иконки и Favicon

Проект включает полную поддержку оптимизированных иконок для всех устройств и браузеров с настраиваемым скруглением углов.

### Доступные команды

```bash
# Генерация всех иконок из исходного файла
npm run generate-icons
```

### 🔘 Скругленные иконки

По умолчанию большие иконки (PWA, Apple, Android) создаются со скругленными углами для современного вида.

**Настройка скругления:**
1. Откройте `scripts/generate-icons.js`
2. Измените параметры в секции `ROUNDED_SETTINGS`:
   - `enableRounded` - включить/выключить скругление
   - `roundedOnlyLargeIcons` - только большие иконки или все
   - `radiusPercent` - радиус скругления (0-50%)
3. Запустите `npm run generate-icons`

Подробное руководство: [docs/ROUNDED_ICONS_GUIDE.md](./docs/ROUNDED_ICONS_GUIDE.md)

### Результат оптимизации
- **До**: 4.0 MB (4 файла по 1 MB)
- **После**: 1.42 MB (экономия 65%)
- **Favicon набор**: ~165 KB для всех размеров

### Поддержка
- ✅ Desktop браузеры (Chrome, Firefox, Safari, Edge, Opera)
- ✅ Mobile браузеры (iOS Safari, Android Chrome)
- ✅ PWA (Progressive Web App) - установка как приложение
- ✅ Open Graph / Twitter Cards для социальных сетей
- ✅ Скругленные углы для современного дизайна

Подробнее: [docs/ICONS_SETUP.md](./docs/ICONS_SETUP.md)

## 🧪 Тестирование

### На эмуляторе Android

```bash
npx expo run:android
```

### На реальном устройстве

1. Установите Expo Go из Google Play
2. Запустите `npx expo start`
3. Отсканируйте QR код

## 📦 Сборка APK

### С помощью EAS Build (рекомендуется)

```bash
# Установка EAS CLI
npm install -g eas-cli

# Вход в аккаунт Expo
eas login

# Конфигурация
eas build:configure

# Сборка APK для Android
eas build --platform android --profile production
```

### Локальная сборка

```bash
npx expo prebuild
cd android
./gradlew assembleRelease
```

APK будет в `android/app/build/outputs/apk/release/app-release.apk`

## 🗄 База данных

### Таблицы

- **profiles** - профили всех пользователей
- **stylists** - данные стилистов (расширение profiles)

### Real-time обновления

Приложение автоматически обновляет данные стилистов при изменениях в БД через Supabase Real-time.

## 🔐 Авторизация

- Email/Password регистрация
- Автоматическое создание профиля при регистрации
- Сохранение сессии в AsyncStorage
- Условная навигация (auth/main)

## 🗺 Работа с картой

- Автоматическое определение геолокации пользователя
- Отображение стилистов с цветными маркерами:
  - 🟢 Зеленый - свободен
  - 🟠 Оранжевый - занят
- Клик на маркер → переход в профиль
- Показ текущего местоположения

## 🔔 Push-уведомления

Приложение поддерживает Web Push уведомления для PWA (Progressive Web App):

### Клиентская часть (✅ Готово)
- Автоматическая подписка пользователей
- UI для управления уведомлениями
- Service Worker для показа уведомлений
- Поддержка Android (Chrome, Edge) и Desktop браузеров

### Серверная часть (требует настройки)
Для полной работы необходимо выполнить деплой:

1. **Настроить VAPID ключи** (уже сгенерированы)
2. **Выполнить SQL миграции** в Supabase
3. **Задеплоить Edge Function** `send-push-notification`
4. **Настроить триггер БД** для автоматической отправки

### Настройка VAPID ключей
1. Добавьте публичный ключ в `.env`:
   ```env
   EXPO_PUBLIC_VAPID_PUBLIC_KEY=BPczBqcwpi3u7Wfpn7dYiHkfOXHaI6uletj_N7HwCJ0hy0OFYl4_MuU48NuKNboJHN3f1o98X88bUOz-V3LCWqg
   ```
2. Выполните `npm run build` (или `npm run postbuild`) — скрипт внедрит ключ в `dist/service-worker.js`, чтобы сервис-воркер мог автоматически перевыпускать подписки (`pushsubscriptionchange`).
3. Убедитесь, что в Supabase secrets заданы **те же** `VAPID_PUBLIC_KEY` и `VAPID_PRIVATE_KEY`. Иначе `web-push` не сможет расшифровать сообщения.

> ⚠️ Без `EXPO_PUBLIC_VAPID_PUBLIC_KEY` пользователи перестанут получать уведомления после истечения браузерной подписки.

### Привязка Supabase → Edge Function
1. После деплоя функции установите параметры в базе:
   ```sql
   alter database postgres set app.settings.supabase_url = 'https://<project>.supabase.co';
   alter database postgres set app.settings.service_role_key = '<service_role_key>';
   ```
2. Перезагрузите конфиг (`select pg_reload_conf();`) или переподключите БД, чтобы триггер увидел значения.
3. Создайте подписку (включите push в PWA), затем отправьте тест:
   ```bash
   curl -X POST "https://<project>.supabase.co/functions/v1/send-push-notification" \
     -H "Authorization: Bearer <service_role_key>" \
     -H "Content-Type: application/json" \
     -d '{"userId":"<uuid>","title":"Тест","message":"Push работает","type":"notification","url":"/notifications"}'
   ```
4. Просмотрите логи: `supabase functions logs send-push-notification --follow`.

📚 **Инструкции:**
- 🖱️ **Без CLI (рекомендую)**: [docs/PUSH_MANUAL_SETUP.md](./docs/PUSH_MANUAL_SETUP.md)
- ⚡ **Быстрая настройка**: [docs/PUSH_QUICK_SETUP.md](./docs/PUSH_QUICK_SETUP.md)
- 📖 **Подробное руководство**: [docs/PUSH_DEPLOYMENT_GUIDE.md](./docs/PUSH_DEPLOYMENT_GUIDE.md)

### Быстрый старт

```bash
# 1. Установите Supabase CLI
npm install -g supabase

# 2. Войдите и свяжите проект
supabase login
supabase link --project-ref your-project-ref

# 3. Установите секреты (VAPID ключи уже сгенерированы)
supabase secrets set VAPID_PUBLIC_KEY=BPczBqcwpi3u7Wfpn7dYiHkfOXHaI6uletj_N7HwCJ0hy0OFYl4_MuU48NuKNboJHN3f1o98X88bUOz-V3LCWqg
supabase secrets set VAPID_PRIVATE_KEY=wcjHrruKLGIDv7fgyvPwDgEW-P1UxTPBv238sNaikCk

# 4. Деплой Edge Function
supabase functions deploy send-push-notification

# 5. Выполните SQL миграции в Supabase Dashboard
# - docs/PUSH_SUBSCRIPTIONS_MIGRATION.sql
# - docs/PUSH_TRIGGER_MIGRATION.sql
```

## 📝 TODO (будущие функции)

- [ ] Гардероб для сохранения образов
- [ ] Чат клиент-стилист
- [ ] Рейтинги и отзывы
- [ ] Нативные push для iOS/Android (Expo Notifications)
- [ ] Email уведомления через Resend

## 🐛 Известные проблемы

- `.env` файл не читается автоматически - используйте `EXPO_PUBLIC_` префикс
- Яндекс.Карты через WebView требуют интернет-соединения
- Real-time требует включения Replication в Supabase

## 📄 Лицензия

MIT

## 👥 Команда

- **Продакт**: Николай Васильков
- **Разработка**: Ярослав Пономарев

---

**Версия**: 1.0.0  
**Последнее обновление**: 2025

