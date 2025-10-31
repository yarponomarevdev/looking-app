# 🗺️ Сборка приложения с Яндекс.Картами

## Важно! ⚠️

**Яндекс.Карты не работают в Expo Go**, так как требуют нативных модулей. 

Необходимо собрать **development build** или **production build**.

## Варианты сборки

### Вариант 1: Development Build (Рекомендуется для разработки)

Development build позволяет запускать приложение на реальном устройстве или эмуляторе с полным доступом к нативным модулям.

#### Для Android:

```bash
# Установите Android Studio и настройте Android SDK
# Затем выполните:

npx expo run:android
```

Это автоматически:
- Создаст нативные папки `android/` и `ios/`
- Установит все зависимости
- Соберет APK
- Установит на устройство/эмулятор

#### Для iOS:

```bash
# Требуется macOS и Xcode
npx expo run:ios
```

### Вариант 2: EAS Build (Облачная сборка)

EAS Build - это сервис Expo для облачной сборки приложений.

```bash
# Установите EAS CLI
npm install -g eas-cli

# Войдите в аккаунт Expo
eas login

# Настройте проект
eas build:configure

# Соберите для Android
eas build --platform android --profile development

# Или для iOS
eas build --platform ios --profile development
```

После сборки вы получите ссылку на скачивание APK/IPA.

### Вариант 3: Production Build (Для релиза)

#### Android APK:

```bash
# Сборка release APK
npx expo run:android --variant release

# APK будет в: android/app/build/outputs/apk/release/
```

#### Через EAS (рекомендуется):

```bash
# Production сборка для Google Play
eas build --platform android --profile production

# Production сборка для App Store
eas build --platform ios --profile production
```

## Настройка API ключа Яндекс.Карт

### Для Development Build:

API ключ уже настроен через файл `.env`:

```env
YANDEX_MAPS_API_KEY=ваш_реальный_ключ
```

### Для EAS Build:

Добавьте переменные окружения в EAS:

```bash
eas secret:create --scope project --name YANDEX_MAPS_API_KEY --value ваш_ключ
```

Или через `eas.json`:

```json
{
  "build": {
    "development": {
      "env": {
        "YANDEX_MAPS_API_KEY": "ваш_ключ"
      }
    }
  }
}
```

## Требования для сборки Android

### 1. Установите Android Studio

Скачайте с https://developer.android.com/studio

### 2. Настройте Android SDK

В Android Studio:
- Tools → SDK Manager
- Установите Android SDK Platform 34 (или новее)
- Установите Android SDK Build-Tools

### 3. Настройте переменные окружения

Windows (PowerShell):
```powershell
$env:ANDROID_HOME = "C:\Users\ВашеИмя\AppData\Local\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools"
$env:PATH += ";$env:ANDROID_HOME\tools"
```

Linux/macOS:
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
```

### 4. Создайте виртуальное устройство (опционально)

В Android Studio:
- Tools → Device Manager
- Create Device
- Выберите Pixel 4 или любое другое устройство
- Выберите System Image (рекомендуется API 34)

## Проверка работы

После успешной сборки и установки:

1. ✅ Откройте приложение на устройстве
2. ✅ Должен появиться экран авторизации
3. ✅ После входа откроется карта с Яндекс.Картами
4. ✅ Карта должна загрузиться и показать вашу геолокацию

## Решение проблем

### Ошибка "Яндекс.Карты недоступны"

**Причина:** Приложение запущено через Expo Go

**Решение:** Используйте development build:
```bash
npx expo run:android
```

### Ошибка сборки Android

**Очистите кеш и пересоберите:**
```bash
cd android
./gradlew clean
cd ..
npx expo run:android
```

### Карта не инициализируется

**Проверьте:**
1. API ключ правильно указан в `.env`
2. API ключ активирован в консоли Яндекс
3. У ключа есть права на MapKit Mobile SDK

### Metro bundler не запускается

```bash
# Очистите кеш
npx expo start -c

# Или
npm start -- --reset-cache
```

## Полезные команды

```bash
# Запуск с очисткой кеша
npx expo run:android --no-build-cache

# Запуск на конкретном устройстве
npx expo run:android --device

# Просмотр логов
npx react-native log-android

# Проверка подключенных устройств
adb devices
```

## Следующие шаги

После успешной сборки:

1. Протестируйте все функции карты
2. Добавьте тестовых стилистов в Supabase
3. Проверьте real-time обновления
4. Настройте дизайн под ваш бренд

## Полезные ссылки

- [Expo Development Build](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [React Native YaMap](https://github.com/volga-volga/react-native-yamap)
- [Яндекс.Карты API](https://developer.tech.yandex.ru/)

---

**Успешной сборки! 🚀**

