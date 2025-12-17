# Папка dist/ - Собранные файлы для production

Папка со скомпилированными файлами для production веб-версии.

## Структура

```
dist/
├── _expo/                    # Внутренние файлы Expo
│   └── static/
│       └── js/
│           └── web/
│               └── index-*.js  # Скомпилированный JavaScript
├── assets/                   # Скомпилированные ресурсы
├── android-chrome-*.png      # Иконки (скопированы из public/)
├── apple-touch-icon.png      # Иконка iOS
├── favicon-*.png             # Favicons
├── favicon.ico               # Favicon для старых браузеров
├── index.html                # Главный HTML файл
├── manifest.json             # PWA манифест
├── metadata.json             # Метаданные сборки
├── mstile-*.png              # Иконки Windows
└── service-worker.js         # Service Worker
```

## Назначение

Папка `dist/` содержит готовые к деплою файлы веб-версии приложения.

### Процесс создания

1. **Expo Export** (`expo export --platform web`)
   - Компилирует React Native код в веб-версию
   - Создает оптимизированный JavaScript bundle
   - Генерирует HTML и метаданные

2. **Postbuild** (`postbuild-web.js`)
   - Копирует файлы из `public/` в `dist/`
   - Обновляет пути в HTML
   - Настраивает service worker

### Содержимое

#### JavaScript Bundle

- `_expo/static/js/web/index-*.js` - основной JavaScript bundle
- Имя файла содержит hash для кэширования
- Минифицирован и оптимизирован для production

#### Статические ресурсы

- `assets/` - изображения, шрифты, другие ресурсы
- Оптимизированы для веб (WebP где возможно)

#### HTML и метаданные

- `index.html` - главная страница приложения
- `manifest.json` - PWA конфигурация
- `metadata.json` - информация о сборке

#### Иконки

Все иконки из `public/` копируются в `dist/` для использования в браузере.

## Деплой

Папка `dist/` готова для деплоя на:
- **Vercel** - автоматический деплой из Git
- **Netlify** - статический хостинг
- **GitHub Pages** - бесплатный хостинг
- Любой другой статический хостинг

### Vercel

Настроен через `vercel.json`:
- Автоматический деплой из `dist/`
- Настройка роутинга для SPA
- Headers для PWA

### Настройка

В `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Git ignore

Папка `dist/` обычно добавляется в `.gitignore`:
- Файлы генерируются при сборке
- Не нужно хранить в репозитории
- Деплой происходит через CI/CD

## Очистка

Перед новой сборкой папка `dist/` очищается:
- Старые файлы удаляются
- Создаются новые с актуальными hash

## Оптимизация

Файлы в `dist/` оптимизированы для production:
- Минификация JavaScript
- Оптимизация изображений
- Gzip/Brotli сжатие (настраивается на сервере)
- Кэширование через service worker

## Отладка

Для отладки production сборки:
1. Запустите локальный сервер в `dist/`:
   ```bash
   npx serve dist
   ```
2. Откройте в браузере
3. Проверьте работу PWA функций

## Важно

- **Не редактируйте файлы в `dist/` вручную** - они перезапишутся при следующей сборке
- Все изменения делайте в исходниках (`src/`, `public/`)
- Проверяйте `dist/` только для проверки результата сборки

