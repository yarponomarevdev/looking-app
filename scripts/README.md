# Скрипты для работы с иконками

## Описание

Эта папка содержит скрипты для оптимизации и генерации иконок приложения.

## Скрипты

### `generate-icons.js`

Генерирует оптимизированные иконки всех размеров для всех браузеров и устройств с поддержкой скругления углов.

**Использование:**
```bash
npm run generate-icons
```

**Настройка скругления:**

В начале файла находится секция `ROUNDED_SETTINGS`:

```javascript
const ROUNDED_SETTINGS = {
  enableRounded: true,              // включить скругление
  roundedOnlyLargeIcons: true,      // только большие иконки
  radiusPercent: 22,                // радиус (0-50%)
};
```

**Что создает:**
- `public/favicon.ico` - favicon для браузеров
- `public/favicon-{16,32,48}x{16,32,48}.png` - иконки для разных разрешений
- `public/apple-touch-icon.png` - иконка для iOS (180x180) 🔘
- `public/android-chrome-{192,512}x{192,512}.png` - иконки для Android 🔘
- `public/mstile-150x150.png` - плитка для Windows 🔘
- `public/manifest.json` - манифест PWA

🔘 = иконки со скругленными углами (по умолчанию)

### `postbuild-web.js`

Копирует статические файлы (иконки, manifest) в папку `dist/` после сборки.

**Использование:**
Автоматически запускается после `npm run build`.

## Структура иконок

### Исходные файлы (assets/)
- `icon.png` - основная иконка приложения (1024x1024)
- `adaptive-icon.png` - адаптивная иконка для Android (1024x1024)
- `splash-icon.png` - иконка для splash screen (1024x1024)
- `favicon.png` - favicon для веб-версии (1024x1024)

### Сгенерированные файлы (public/)
- Различные размеры favicon для всех браузеров
- PWA манифест
- index.html с правильными meta-тегами

## Поддерживаемые браузеры

✅ Chrome/Edge (все версии)
✅ Firefox (все версии)
✅ Safari (все версии)
✅ Opera (все версии)
✅ iOS Safari
✅ Android Chrome
✅ Samsung Internet

## PWA поддержка

Приложение полностью поддерживает Progressive Web App (PWA):
- Манифест для установки как приложение
- Адаптивные иконки для всех устройств
- Правильные размеры для всех платформ

