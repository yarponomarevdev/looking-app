# Looking - Мобильное приложение для поиска стилистов

**Looking** — мобильное приложение для поиска и просмотра стилистов в торговых центрах Москвы.

## 📱 Основные функции MVP

- ✅ Карта с Яндекс.Картами (WebView), показывающая активных стилистов в реальном времени
- ✅ Список всех доступных стилистов
- ✅ Детальные профили стилистов с портфолио
- ✅ Авторизация через email/password (Supabase Auth)
- ✅ Личный кабинет пользователя

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

```bash
npx expo start
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
├── App.tsx                            # Точка входа
├── app.config.ts                      # Конфигурация Expo
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

