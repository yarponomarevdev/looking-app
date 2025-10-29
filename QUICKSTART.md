# 🚀 Быстрый старт Looking

## Что уже сделано ✅

- ✅ Expo проект инициализирован
- ✅ Все зависимости установлены
- ✅ Структура проекта создана
- ✅ Все экраны реализованы
- ✅ Навигация настроена
- ✅ Авторизация через Supabase
- ✅ Карта с Google Maps
- ✅ Real-time обновления

## Что нужно сделать перед запуском

### 1. Настроить Supabase (5 минут)

#### Создать проект
1. Зайти на https://supabase.com
2. Создать новый проект "Looking"
3. Выбрать регион (Frankfurt для РФ)

#### Выполнить миграцию
1. В Supabase Dashboard → **SQL Editor**
2. Скопировать весь код из `supabase-migration.sql`
3. Вставить и нажать **Run**

#### Получить ключи
1. **Settings** → **API**
2. Скопировать:
   - Project URL
   - anon public key

#### Создать .env файл
Создайте файл `.env` в папке `looking-app/`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://ваш-проект.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Настроить Google Maps API (3 минуты)

#### Получить ключ
1. https://console.cloud.google.com/
2. Создать проект
3. Включить **Maps SDK for Android**
4. **APIs & Services** → **Credentials** → **Create API Key**

#### Добавить в app.json
Откройте `app.json` и замените:

```json
"googleMaps": {
  "apiKey": "AIzaSy..."  // Ваш настоящий ключ
}
```

## Запуск приложения

### Вариант 1: На реальном телефоне (рекомендуется)

```bash
cd looking-app
npx expo start
```

1. Установите **Expo Go** на телефон:
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent
2. Отсканируйте QR код из терминала

### Вариант 2: На Android эмуляторе

```bash
cd looking-app
npx expo run:android
```

(Требуется Android Studio с настроенным AVD)

## Проверка работы

После запуска:

1. ✅ Должен открыться экран авторизации
2. ✅ Зарегистрируйте тестового пользователя
3. ✅ Должна открыться карта Москвы

### Добавить тестового стилиста

Чтобы увидеть маркер на карте:

1. В Supabase → **Table Editor** → **auth.users**
2. Скопируйте ваш UUID
3. **Table Editor** → **stylists** → **Insert row**:
   ```
   user_id: ваш-uuid
   bio: "Профессиональный стилист"
   status: available
   latitude: 55.7558
   longitude: 37.6173
   current_mall: "ТЦ Европейский"
   rating: 4.5
   ```
4. Обновите карту - стилист появится!

## Сборка APK для тестирования

### Через EAS Build (проще)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile development
```

APK скачается автоматически после сборки.

### Локально (требует Android Studio)

```bash
npx expo prebuild
cd android
./gradlew assembleRelease
```

APK: `android/app/build/outputs/apk/release/app-release.apk`

## Troubleshooting

### Приложение не запускается
```bash
npx expo start --clear
```

### Ошибка "Supabase URL not defined"
- Проверьте, что файл `.env` создан
- Убедитесь, что используется префикс `EXPO_PUBLIC_`
- Перезапустите: `npx expo start -c`

### Карта не загружается
- Проверьте Google Maps API ключ в `app.json`
- Убедитесь, что Maps SDK for Android включен
- В Expo Go карты могут работать некорректно - используйте development build

### Стилисты не отображаются
- Проверьте, что миграция выполнена
- Добавьте тестового стилиста вручную
- Проверьте Real-time: Database → Replication → включите для `stylists`

## Структура экранов

```
Auth Flow:
├── AuthScreen (вход/регистрация)
│
Main Flow (после входа):
├── MainTabs
│   ├── MapScreen (карта стилистов)
│   ├── StylistListScreen (список)
│   └── ProfileScreen (профиль)
└── StylistDetailScreen (детали стилиста)
```

## Следующие шаги

- [ ] Добавить реальных стилистов в БД
- [ ] Кастомизировать дизайн под бренд
- [ ] Реализовать бронирование
- [ ] Добавить гардероб
- [ ] Настроить push-уведомления

## Полезные команды

```bash
# Запуск с очисткой кэша
npx expo start --clear

# Показать логи
npx expo start --dev-client

# Проверить зависимости
npx expo-doctor

# Обновить зависимости
npx expo install --fix
```

## Поддержка

Если что-то не работает:
1. Проверьте [README.md](./README.md)
2. Подробная настройка Supabase: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
3. Проверьте логи в терминале

---

**Готово! Приложение работает! 🎉**

