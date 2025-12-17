# Папка public/ - Публичные файлы для веб-версии

Статические файлы, которые копируются в `dist/` при сборке веб-версии.

## Структура

```
public/
├── android-chrome-192x192.png    # Иконка Android для PWA
├── android-chrome-512x512.png    # Иконка Android для PWA
├── apple-touch-icon.png          # Иконка для iOS при добавлении на главный экран
├── favicon-16x16.png             # Favicon 16x16
├── favicon-32x32.png             # Favicon 32x32
├── favicon-48x48.png             # Favicon 48x48
├── favicon.ico                   # Favicon для старых браузеров
├── favicon.png                   # Основной favicon
├── index.html                    # HTML шаблон для веб-версии
├── manifest.json                 # PWA манифест
├── mstile-150x150.png            # Иконка для Windows tiles
└── service-worker.js             # Service Worker для PWA
```

## Назначение файлов

### Иконки и favicon

Все иконки для веб-версии:
- **favicon-*.png** - разные размеры favicon для браузеров
- **favicon.ico** - favicon для старых браузеров
- **apple-touch-icon.png** - иконка при добавлении на главный экран iOS
- **android-chrome-*.png** - иконки для Android PWA
- **mstile-*.png** - иконка для Windows

### index.html

HTML шаблон для веб-версии:
- Точка входа для React приложения
- Содержит мета-теги для SEO
- Подключает скрипты и стили
- Настраивает PWA

### manifest.json

PWA манифест:
- Название и описание приложения
- Иконки разных размеров
- Цвета темы
- Режим отображения (standalone, fullscreen)
- Start URL

Пример структуры:
```json
{
  "name": "Looking App",
  "short_name": "Looking",
  "icons": [...],
  "theme_color": "#6200ee",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/"
}
```

### service-worker.js

Service Worker для PWA функциональности:
- Кэширование ресурсов для офлайн работы
- Обработка push-уведомлений
- Фоновая синхронизация
- Обновление кэша

## Процесс сборки

При выполнении `npm run build`:

1. Expo экспортирует веб-версию в `dist/`
2. Скрипт `postbuild-web.js` копирует файлы из `public/` в `dist/`
3. Обновляются пути в HTML и манифесте
4. Настраивается service worker

## Использование в production

После сборки файлы из `public/` доступны по корневому пути:
- `/favicon.ico` → `dist/favicon.ico`
- `/manifest.json` → `dist/manifest.json`
- `/service-worker.js` → `dist/service-worker.js`

## Обновление файлов

### Иконки

Иконки генерируются автоматически из `assets/` через `generate-icons.js`.

### Манифест

Обновляется вручную в `public/manifest.json`:
- Название приложения
- Цвета темы
- Иконки

### Service Worker

Обновляется вручную в `public/service-worker.js`:
- Стратегии кэширования
- Обработка push-уведомлений
- Логика обновлений

## SEO и мета-теги

Мета-теги настраиваются в:
- `index.html` - базовые теги
- `app.config.ts` - через Expo конфигурацию
- `manifest.json` - PWA метаданные

## PWA функциональность

Файлы в `public/` обеспечивают:
- Установку приложения на устройство
- Офлайн работу
- Push-уведомления
- Добавление на главный экран

