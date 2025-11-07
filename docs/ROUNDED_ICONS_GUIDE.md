# Руководство по скругленным иконкам

## 🎨 Настройка скругления

Все настройки скругления находятся в файле `scripts/generate-icons.js` в начале файла:

```javascript
const ROUNDED_SETTINGS = {
  // Включить/выключить скругление для всех иконок
  enableRounded: true,
  
  // Включить скругление только для больших иконок (PWA, Apple, Android)
  roundedOnlyLargeIcons: true,
  
  // Радиус скругления в процентах от размера (0-50)
  // Например: 25 = 25% от размера иконки
  radiusPercent: 22,
};
```

## 📋 Параметры

### `enableRounded`
**Тип:** boolean  
**По умолчанию:** `true`

Включает/выключает скругление для всех иконок.

- `true` - иконки будут со скругленными углами
- `false` - все иконки будут квадратными

### `roundedOnlyLargeIcons`
**Тип:** boolean  
**По умолчанию:** `true`

Применяет скругление только к большим иконкам (PWA, Apple, Android, Windows Tiles).

- `true` - скругляются только большие иконки (рекомендуется)
- `false` - скругляются все иконки, включая маленькие favicon

**Какие иконки считаются "большими":**
- ✅ `apple-touch-icon.png` (180x180)
- ✅ `android-chrome-192x192.png` (192x192)
- ✅ `android-chrome-512x512.png` (512x512)
- ✅ `mstile-150x150.png` (150x150)

**Какие иконки считаются "маленькими":**
- ❌ `favicon-16x16.png` (16x16)
- ❌ `favicon-32x32.png` (32x32)
- ❌ `favicon-48x48.png` (48x48)
- ❌ `favicon.png` (32x32)

### `radiusPercent`
**Тип:** number (0-50)  
**По умолчанию:** `22`

Радиус скругления в процентах от размера иконки.

**Примеры:**
- `0` - квадратные углы (без скругления)
- `10` - едва заметное скругление
- `22` - умеренное скругление (рекомендуется)
- `30` - сильное скругление
- `50` - круглая иконка

**Расчет:**
- Для иконки 192x192 с `radiusPercent: 22`
- Радиус = 192 × 22 / 100 = 42px

## 🔄 Примеры конфигураций

### Полностью квадратные иконки

```javascript
const ROUNDED_SETTINGS = {
  enableRounded: false,
  roundedOnlyLargeIcons: true,
  radiusPercent: 22,
};
```

### Скругление всех иконок (включая маленькие favicon)

```javascript
const ROUNDED_SETTINGS = {
  enableRounded: true,
  roundedOnlyLargeIcons: false,
  radiusPercent: 22,
};
```

### Сильное скругление (почти круглые)

```javascript
const ROUNDED_SETTINGS = {
  enableRounded: true,
  roundedOnlyLargeIcons: true,
  radiusPercent: 40,
};
```

### Минимальное скругление

```javascript
const ROUNDED_SETTINGS = {
  enableRounded: true,
  roundedOnlyLargeIcons: true,
  radiusPercent: 10,
};
```

### iOS стиль (как в App Store)

```javascript
const ROUNDED_SETTINGS = {
  enableRounded: true,
  roundedOnlyLargeIcons: true,
  radiusPercent: 22,  // Apple использует ~22% радиус
};
```

## 🎯 Рекомендации

### Для PWA приложений
```javascript
const ROUNDED_SETTINGS = {
  enableRounded: true,
  roundedOnlyLargeIcons: true,
  radiusPercent: 22,
};
```
Скругленные иконки выглядят современно и соответствуют дизайн-системам iOS и Android.

### Для корпоративных приложений
```javascript
const ROUNDED_SETTINGS = {
  enableRounded: true,
  roundedOnlyLargeIcons: true,
  radiusPercent: 15,
};
```
Меньший радиус создает более профессиональный вид.

### Для игр и развлечений
```javascript
const ROUNDED_SETTINGS = {
  enableRounded: true,
  roundedOnlyLargeIcons: false,
  radiusPercent: 30,
};
```
Сильное скругление для более игривого дизайна.

## 🔧 Применение изменений

После изменения настроек в `scripts/generate-icons.js`:

```bash
# 1. Сгенерируйте новые иконки
npm run generate-icons

# 2. Пересоберите проект (для веб-версии)
npm run build
```

## 📱 Как это выглядит на разных платформах

### iOS (Safari)
iOS **автоматически** применяет свое скругление к `apple-touch-icon.png`, даже если вы предоставите квадратную иконку. Однако, предварительное скругление обеспечивает больше контроля над финальным видом.

### Android (Chrome)
Android использует иконки как есть. Скругленные иконки будут выглядеть современно и соответствовать Material Design.

### Desktop
В браузерах favicon обычно отображаются маленькими (16x16, 32x32), поэтому скругление может быть незаметно. По умолчанию они остаются квадратными.

### Windows
Microsoft Tiles поддерживают скругление и отлично выглядят со скругленными углами.

## 🎨 Визуальное сравнение

```
radiusPercent: 0   ⬜ (квадратная)
radiusPercent: 10  ▢  (слегка скругленная)
radiusPercent: 22  ⬜️  (умеренно скругленная) ← РЕКОМЕНДУЕТСЯ
radiusPercent: 30  ⬜  (сильно скругленная)
radiusPercent: 50  ⚫ (круглая)
```

## ⚙️ Технические детали

### Как работает скругление

Скрипт создает SVG маску с закругленными углами:

```xml
<svg width="size" height="size">
  <rect x="0" y="0" 
        width="size" height="size" 
        rx="radius" ry="radius" 
        fill="white"/>
</svg>
```

Затем маска применяется к изображению через `sharp.composite()` с режимом `dest-in`.

### Производительность

Скругление добавляет минимальные задержки:
- ~10-20ms на иконку
- Размер файла увеличивается на 5-10%

### Совместимость

Скругленные PNG иконки поддерживаются всеми современными браузерами:
- ✅ Chrome/Edge (все версии)
- ✅ Firefox (все версии)
- ✅ Safari (все версии)
- ✅ iOS Safari
- ✅ Android Chrome

## 🐛 Устранение неполадок

### Иконки не скругляются

1. Проверьте, что `enableRounded: true`
2. Убедитесь, что `radiusPercent > 0`
3. Запустите `npm run generate-icons` после изменений

### Слишком сильное скругление

Уменьшите `radiusPercent` до 15-20.

### Скругление не видно в браузере

Маленькие favicon (16x16, 32x32) могут не показывать скругление из-за размера. Это нормально. Установите `roundedOnlyLargeIcons: true`.

### Артефакты по краям

Убедитесь, что исходная иконка имеет прозрачный фон и достаточно высокое разрешение (минимум 1024x1024).

## 📚 Дополнительные ресурсы

- [Apple Human Interface Guidelines - App Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Material Design - Product Icons](https://material.io/design/iconography/product-icons.html)
- [PWA Icon Guidelines](https://web.dev/add-manifest/)

