# 🚀 Быстрый старт Looking

## Что уже сделано ✅

- ✅ Expo проект инициализирован
- ✅ Все зависимости установлены
- ✅ Структура проекта создана
- ✅ Все экраны реализованы
- ✅ Навигация настроена
- ✅ Авторизация через Supabase
- ✅ Карта с Яндекс.Картами
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

#### Настроить переменные окружения
Откройте файл `.env` в папке `looking-app/` и добавьте:

```env
EXPO_PUBLIC_SUPABASE_URL=https://ваш-проект.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Настроить Яндекс.Карты API (3 минуты)

#### Получить ключ
1. Перейдите на https://developer.tech.yandex.ru/
2. Войдите в аккаунт Яндекс или создайте новый
3. Создайте новый ключ для **MapKit Mobile SDK**
4. Скопируйте полученный API ключ

#### Добавить в .env
Откройте файл `.env` и добавьте:

```env
YANDEX_MAPS_API_KEY=ваш_api_ключ_яндекс_карт
```

📖 Подробная инструкция: [ENV_SETUP.md](./ENV_SETUP.md)

## Запуск приложения

### ⚠️ ВАЖНО: Яндекс.Карты требуют Development Build

**Яндекс.Карты НЕ работают в Expo Go!** Необходимо собрать приложение с нативными модулями.

### Вариант 1: Development Build на Android (Рекомендуется)

```bash
cd looking-app
npx expo run:android
```

Это автоматически соберет и установит приложение на устройство/эмулятор.

**Требования:**
- Android Studio установлена
- Android SDK настроен
- USB отладка включена на телефоне (или запущен эмулятор)

📖 **Подробная инструкция по сборке:** [YANDEX_MAPS_BUILD.md](./YANDEX_MAPS_BUILD.md)

### Вариант 2: Через EAS Build (Облачная сборка)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile development
```

APK скачается автоматически после сборки.

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
- Проверьте Яндекс.Карты API ключ в `.env`
- Убедитесь, что ключ активирован для MapKit Mobile SDK
- Перезапустите Metro bundler: `npx expo start -c`

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

