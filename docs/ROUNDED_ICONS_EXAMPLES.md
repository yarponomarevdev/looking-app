# Примеры скругленных иконок

## 🎯 Быстрый старт

**Чтобы изменить степень скругления:**

1. Откройте `scripts/generate-icons.js`
2. Найдите в начале файла:

```javascript
const ROUNDED_SETTINGS = {
  enableRounded: true,
  roundedOnlyLargeIcons: true,
  radiusPercent: 22,  // ← ИЗМЕНИТЕ ЭТО ЗНАЧЕНИЕ
};
```

3. Запустите:
```bash
npm run generate-icons
npm run build
```

## 📊 Варианты скругления

### radiusPercent: 0 (квадратная)
```
┌─────────┐
│         │
│    🎨   │
│         │
└─────────┘
```
Классический вид, подходит для корпоративного дизайна.

### radiusPercent: 10 (слегка скругленная)
```
╭────────╮
│        │
│   🎨   │
│        │
╰────────╯
```
Минимальное скругление, сохраняющее строгость.

### radiusPercent: 22 (умеренная) ⭐ РЕКОМЕНДУЕТСЯ
```
╭───────╮
│       │
│  🎨   │
│       │
╰───────╯
```
Стандарт iOS и современных приложений.

### radiusPercent: 30 (сильная)
```
╭──────╮
│      │
│  🎨  │
│      │
╰──────╯
```
Выразительное скругление для креативных приложений.

### radiusPercent: 50 (круглая)
```
   ╭────╮
  │      │
  │  🎨  │
  │      │
   ╰────╯
```
Полностью круглая иконка.

## 🎨 Примеры использования

### Для социальных сетей

```javascript
const ROUNDED_SETTINGS = {
  enableRounded: true,
  roundedOnlyLargeIcons: true,
  radiusPercent: 22,
};
```

### Для финансовых приложений

```javascript
const ROUNDED_SETTINGS = {
  enableRounded: true,
  roundedOnlyLargeIcons: true,
  radiusPercent: 15,  // более строгий вид
};
```

### Для игр

```javascript
const ROUNDED_SETTINGS = {
  enableRounded: true,
  roundedOnlyLargeIcons: false,  // скруглить все иконки
  radiusPercent: 35,  // более игривый вид
};
```

### Минималистичный дизайн

```javascript
const ROUNDED_SETTINGS = {
  enableRounded: false,  // квадратные иконки
  roundedOnlyLargeIcons: true,
  radiusPercent: 0,
};
```

## 📱 Как это выглядит на устройствах

### iPhone (Apple Touch Icon)
- Размер: 180x180
- Радиус по умолчанию (22%): ~40px
- iOS дополнительно применяет свое скругление поверх

### Android (Chrome)
- Размер: 192x192 и 512x512
- Радиус по умолчанию (22%): ~42px и ~113px
- Android использует иконку как есть

### Windows (Microsoft Tile)
- Размер: 150x150
- Радиус по умолчанию (22%): ~33px
- Windows применяет свои эффекты поверх

### Desktop (Favicon)
- Размер: 16x16, 32x32, 48x48
- Квадратные (скругление не применяется)
- Слишком маленькие для заметного скругления

## 🔧 Продвинутые настройки

### Скругление только для PWA

```javascript
const ROUNDED_SETTINGS = {
  enableRounded: true,
  roundedOnlyLargeIcons: true,  // только большие
  radiusPercent: 22,
};
```
Результат: скругленные PWA иконки, квадратные favicon

### Скругление всех иконок

```javascript
const ROUNDED_SETTINGS = {
  enableRounded: true,
  roundedOnlyLargeIcons: false,  // все иконки
  radiusPercent: 22,
};
```
Результат: все иконки будут скруглены

### Круглые иконки (как Telegram)

```javascript
const ROUNDED_SETTINGS = {
  enableRounded: true,
  roundedOnlyLargeIcons: true,
  radiusPercent: 50,  // 50% = круг
};
```

## 💡 Советы

1. **Начните с 22%** - это стандарт индустрии (iOS, Android)
2. **Тестируйте на реальных устройствах** - скругление выглядит по-разному на разных экранах
3. **Учитывайте содержимое** - если в иконке есть текст по углам, используйте меньший радиус
4. **Согласованность** - используйте одинаковый процент для всех иконок
5. **Маленькие favicon** - обычно оставляют квадратными

## 🎯 Рекомендации по отраслям

| Отрасль | radiusPercent | Причина |
|---------|---------------|---------|
| Финансы | 10-15 | Профессиональный вид |
| E-commerce | 20-22 | Баланс современности и строгости |
| Социальные сети | 22-25 | Следование стандартам iOS/Android |
| Игры | 30-40 | Веселый, дружелюбный вид |
| Утилиты | 15-20 | Практичность и функциональность |
| Креатив | 25-35 | Выразительность |
| Образование | 20-25 | Дружелюбный, но серьезный |

## 📏 Математика скругления

```
Радиус в пикселях = Размер иконки × (radiusPercent / 100)

Примеры:
- 192px × 22% = 42px
- 512px × 22% = 113px
- 180px × 22% = 40px
```

## ✨ Финальный чеклист

- [ ] Открыл `scripts/generate-icons.js`
- [ ] Нашел секцию `ROUNDED_SETTINGS`
- [ ] Изменил `radiusPercent` на нужное значение
- [ ] Запустил `npm run generate-icons`
- [ ] Проверил результат в `public/`
- [ ] Запустил `npm run build` для веб-версии
- [ ] Протестировал на реальном устройстве

---

**Больше информации:**
- [docs/ICONS_SETUP.md](./ICONS_SETUP.md) - Общая настройка иконок
- [docs/ROUNDED_ICONS_GUIDE.md](./ROUNDED_ICONS_GUIDE.md) - Полное руководство

