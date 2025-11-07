# Настройка иконок и favicon

## Обзор

Проект настроен с полной поддержкой иконок для всех устройств и браузеров:

- ✅ **Desktop браузеры**: Chrome, Firefox, Safari, Edge, Opera
- ✅ **Mobile браузеры**: iOS Safari, Android Chrome, Samsung Internet
- ✅ **Progressive Web App (PWA)**: Полная поддержка установки как приложение
- ✅ **Социальные сети**: Open Graph и Twitter Cards

## Структура файлов

### Исходные иконки (`assets/`)
```
assets/
├── icon.png              # Основная иконка (1024x1024, 355 KB)
├── adaptive-icon.png     # Адаптивная иконка для Android (1024x1024, 355 KB)
├── splash-icon.png       # Иконка для splash screen (1024x1024, 355 KB)
└── favicon.png           # Favicon (1024x1024, 355 KB)
```

### Сгенерированные файлы (`public/`)
```
public/
├── favicon.ico                    # Favicon для всех браузеров
├── favicon-16x16.png             # 16×16 favicon
├── favicon-32x32.png             # 32×32 favicon
├── favicon-48x48.png             # 48×48 favicon
├── apple-touch-icon.png          # 180×180 Apple Touch Icon
├── android-chrome-192x192.png    # 192×192 Android Chrome
├── android-chrome-512x512.png    # 512×512 Android Chrome
├── mstile-150x150.png            # 150×150 Microsoft Tile
├── manifest.json                 # PWA манифест
└── index.html                    # HTML с мета-тегами
```

## Команды

### Генерация иконок
```bash
npm run generate-icons
```
Генерирует все размеры иконок из исходного файла `assets/icon.png`.

### 🔘 Настройка скругления

По умолчанию большие иконки (PWA, Apple, Android) создаются со скругленными углами (радиус 22%).

**Изменить настройки скругления:**

1. Откройте `scripts/generate-icons.js`
2. Найдите секцию `ROUNDED_SETTINGS` в начале файла:

```javascript
const ROUNDED_SETTINGS = {
  enableRounded: true,              // включить скругление
  roundedOnlyLargeIcons: true,      // только большие иконки
  radiusPercent: 22,                // радиус скругления (0-50)
};
```

3. Измените параметры по своему вкусу
4. Запустите `npm run generate-icons`

**Примеры:**
- Квадратные иконки: `enableRounded: false`
- Круглые иконки: `radiusPercent: 50`
- Скругление всех favicon: `roundedOnlyLargeIcons: false`

**Подробнее:** [docs/ROUNDED_ICONS_GUIDE.md](./ROUNDED_ICONS_GUIDE.md)

### Сборка веб-версии
```bash
npm run build
```
Собирает веб-версию и автоматически копирует все иконки в `dist/`.

## Поддерживаемые форматы

| Браузер / Устройство | Размер | Файл |
|---------------------|--------|------|
| Desktop Browsers | 16×16, 32×32, 48×48 | `favicon-*.png`, `favicon.ico` |
| Apple iOS | 180×180 | `apple-touch-icon.png` |
| Android Chrome | 192×192, 512×512 | `android-chrome-*.png` |
| Microsoft Tiles | 150×150 | `mstile-150x150.png` |
| Open Graph | 512×512 | `android-chrome-512x512.png` |

## PWA (Progressive Web App)

Приложение полностью поддерживает PWA с манифестом (`manifest.json`):

```json
{
  "name": "Looking",
  "short_name": "Looking",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#6200ee",
  "background_color": "#ffffff",
  "orientation": "portrait",
  "icons": [...]
}
```

Пользователи могут установить веб-версию как нативное приложение на:
- Android (Chrome, Samsung Internet)
- iOS/iPadOS (Safari)
- Desktop (Chrome, Edge)

## Оптимизация

### Размеры файлов

**До оптимизации:**
- Каждый файл: ~1.0 MB
- Всего: ~4.0 MB

**После оптимизации:**
- `icon.png`: 355 KB (-66%)
- `adaptive-icon.png`: 355 KB (-66%)
- `splash-icon.png`: 355 KB (-66%)
- `favicon.png`: 355 KB (-66%)
- **Всего**: 1.42 MB (-65%)

**Сгенерированные favicon:**
- Всего: ~162 KB для всех размеров

### Параметры оптимизации

```javascript
{
  quality: 85,
  compressionLevel: 9,
  adaptiveFiltering: true,
  effort: 10
}
```

## Обновление иконок

1. Замените файл `assets/icon.png` на новую иконку (рекомендуется 1024×1024 или больше)
2. Запустите генерацию: `npm run generate-icons`
3. Соберите проект: `npm run build`

## Проверка

### Тестирование favicon

**Desktop:**
1. Откройте приложение в браузере
2. Проверьте favicon во вкладке браузера
3. Добавьте в закладки и проверьте иконку

**Mobile:**
1. Откройте в мобильном браузере
2. "Добавить на главный экран"
3. Проверьте иконку на рабочем столе

**PWA:**
1. Chrome DevTools > Application > Manifest
2. Проверьте все иконки и настройки

### Валидация

- [Favicon Checker](https://realfavicongenerator.net/favicon_checker)
- [PWA Builder](https://www.pwabuilder.com/)

## Техническая информация

### Мета-теги в index.html

```html
<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">

<!-- Apple -->
<link rel="apple-touch-icon" href="/apple-touch-icon.png">

<!-- Android -->
<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">

<!-- PWA -->
<link rel="manifest" href="/manifest.json">
```

### Конфигурация Expo

```typescript
// app.config.ts
web: {
  favicon: './assets/favicon.png',
  bundler: 'metro',
  output: 'single',
  meta: {
    name: 'Looking',
    description: 'Looking - находите стилистов рядом с вами',
    themeColor: '#6200ee',
  },
}
```

## Troubleshooting

### Иконки не отображаются после деплоя

1. Проверьте, что все файлы скопированы в `dist/`
2. Убедитесь, что пути в HTML относительные (начинаются с `/`)
3. Очистите кэш браузера (Ctrl+Shift+Delete)

### Старая иконка в браузере

1. Очистите кэш сайта
2. Hard refresh (Ctrl+Shift+R)
3. Проверьте версию файлов на сервере

### PWA не устанавливается

1. Проверьте `manifest.json` в DevTools
2. Убедитесь, что используется HTTPS (обязательно для PWA)
3. Проверьте все иконки доступны (статус 200)

## Ресурсы

- [Expo Web Documentation](https://docs.expo.dev/guides/web/)
- [PWA Guidelines](https://web.dev/progressive-web-apps/)
- [Favicon Best Practices](https://github.com/audreyfeldroy/favicon-cheat-sheet)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

