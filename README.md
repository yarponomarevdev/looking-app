# Looking - Мобильное приложение для поиска стилистов

**Looking** — мобильное приложение для поиска и просмотра стилистов в торговых центрах Москвы.

## 📱 Основные функции MVP

- ✅ Карта с Google Maps, показывающая активных стилистов в реальном времени
- ✅ Список всех доступных стилистов
- ✅ Детальные профили стилистов с портфолио
- ✅ Авторизация через email/password (Supabase Auth)
- ✅ Личный кабинет пользователя

## 🛠 Технологический стек

- **Frontend**: React Native (Expo)
- **Язык**: TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Карты**: Google Maps (react-native-maps)
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
- Google Maps API ключ

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

4. **Настройте Google Maps API**

- Получите ключ: https://console.cloud.google.com/
- Включите Maps SDK for Android
- Добавьте ключ в `app.json`:

```json
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
    }
  }
}
```

5. **Запустите приложение**

```bash
npx expo start
```

Отсканируйте QR код в приложении Expo Go на телефоне.

## 📂 Структура проекта

```
looking-app/
├── src/
│   ├── components/
│   │   └── map/
│   │       └── StylistMarker.tsx      # Маркер стилиста на карте
│   ├── screens/
│   │   ├── MapScreen.tsx              # Главный экран с картой
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
├── App.tsx                            # Точка входа
├── app.json                           # Конфигурация Expo
└── supabase-migration.sql             # SQL миграция для БД
```

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

## 📝 TODO (будущие функции)

- [ ] Система бронирования встреч
- [ ] Email уведомления через Resend
- [ ] Гардероб для сохранения образов
- [ ] Чат клиент-стилист
- [ ] Рейтинги и отзывы
- [ ] Push уведомления

## 🐛 Известные проблемы

- `.env` файл не читается автоматически - используйте `EXPO_PUBLIC_` префикс
- Google Maps может не работать в Expo Go - используйте development build
- Real-time требует включения Replication в Supabase

## 📄 Лицензия

MIT

## 👥 Команда

- **Продакт**: Николай Васильков
- **Разработка**: Ярослав Пономарев

---

**Версия**: 1.0.0  
**Последнее обновление**: 2025

