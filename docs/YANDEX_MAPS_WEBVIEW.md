# 🗺️ Яндекс.Карты через WebView

## ✅ Преимущества WebView подхода

**Яндекс.Карты через WebView работают в Expo Go** без необходимости нативных модулей!

- ✅ Работает в Expo Go (не требуется development build)
- ✅ Простая настройка через JavaScript API
- ✅ Не требуется Android Studio или Xcode
- ✅ Быстрая разработка и тестирование
- ✅ Кроссплатформенность из коробки

## Как это работает

Приложение использует `react-native-webview` для отображения Яндекс.Карт через JavaScript API 2.1:

1. **WebView** загружает HTML с подключенным JavaScript API Яндекс.Карт
2. **Карта инициализируется** с использованием ymaps библиотеки
3. **Маркеры** добавляются динамически через JavaScript
4. **Взаимодействие** происходит через `postMessage` между React Native и WebView

## Быстрый старт

### 1. Установите зависимости

```bash
npm install
```

### 2. Настройте API ключ

Создайте файл `.env`:

```env
YANDEX_MAPS_API_KEY=ваш_api_ключ
```

> **Примечание:** API ключ уже жестко закодирован в MapScreen.tsx для упрощения. 
> В production рекомендуется использовать переменные окружения.

### 3. Запустите приложение

```bash
npx expo start
```

Затем запустите в Expo Go на телефоне или через эмулятор.

## Структура реализации

### MapScreen.tsx

Основной компонент карты:

```typescript
src/screens/MapScreen.tsx
```

**Функционал:**
- Загрузка карты через WebView
- Отображение маркеров стилистов
- Геолокация пользователя
- Обработка кликов по маркерам
- Real-time обновления позиций

### Взаимодействие с картой

#### Отправка данных в WebView:

```javascript
webViewRef.current?.injectJavaScript(`
  window.updateMarkers(${JSON.stringify(markersData)});
`);
```

#### Получение событий из WebView:

```javascript
const handleMessage = (event) => {
  const data = JSON.parse(event.nativeEvent.data);
  if (data.type === 'markerClick') {
    navigation.navigate('StylistDetail', { id: data.stylistId });
  }
};
```

## Настройка карты

### Изменение начальных координат

В `MapScreen.tsx` измените центр карты:

```javascript
center: [55.7558, 37.6173], // Москва по умолчанию
```

### Добавление кастомных элементов управления

В HTML-шаблоне карты:

```javascript
controls: ['zoomControl', 'geolocationControl', 'typeSelector']
```

Доступные контролы:
- `zoomControl` - масштабирование
- `geolocationControl` - определение местоположения
- `typeSelector` - выбор типа карты
- `fullscreenControl` - полноэкранный режим
- `routeButtonControl` - построение маршрута

### Настройка маркеров

Цвет маркера зависит от статуса стилиста:

```javascript
const color = stylist.status === 'available' ? '#4CAF50' : '#FFA726';
```

Типы маркеров:
- `islands#circleIcon` - круглая иконка
- `islands#dotIcon` - точка
- `islands#icon` - стандартная иконка

## Получение API ключа

### 1. Зарегистрируйтесь

Перейдите на [developer.tech.yandex.ru](https://developer.tech.yandex.ru/)

### 2. Создайте API ключ

1. Войдите в консоль разработчика
2. Создайте новый проект
3. Включите **JavaScript API и HTTP Геокодер**
4. Скопируйте API ключ

### 3. Добавьте в приложение

Вставьте ключ в `src/screens/MapScreen.tsx`:

```javascript
const htmlContent = `
  <script src="https://api-maps.yandex.ru/2.1/?apikey=ВАШ_КЛЮЧ&lang=ru_RU"></script>
`;
```

## Решение проблем

### Карта не загружается

**Проверьте:**
1. API ключ корректен
2. Интернет-соединение активно
3. API ключ активирован в консоли Яндекс

**Отладка:**
```javascript
// В MapScreen.tsx добавьте логирование
console.log('Map loaded:', mapLoaded);
```

### Маркеры не отображаются

**Проверьте:**
1. Данные стилистов загружены: `console.log(stylists)`
2. Координаты корректны (latitude, longitude)
3. WebView загружен: `mapLoaded === true`

### Геолокация не работает

**На Android:**
Убедитесь, что разрешения добавлены в `app.config.ts`:

```javascript
android: {
  permissions: [
    'ACCESS_FINE_LOCATION',
    'ACCESS_COARSE_LOCATION',
  ],
}
```

**В приложении:**
Разрешите доступ к геолокации при первом запросе.

### WebView медленно работает

**Оптимизация:**

1. Ограничьте количество маркеров
2. Используйте кластеризацию для большого числа точек
3. Отключите ненужные контролы

## Ограничения WebView подхода

### Что работает:
✅ Базовые функции карты
✅ Маркеры и их обновление
✅ Геолокация пользователя
✅ Клики и навигация
✅ Кастомизация стилей

### Потенциальные ограничения:
⚠️ Производительность при большом числе маркеров (>1000)
⚠️ Некоторые продвинутые функции MapKit могут быть недоступны
⚠️ Зависимость от интернет-соединения для загрузки карты

## Миграция на нативные модули (если нужно)

Если в будущем понадобится больше производительности или offline режим, можно мигрировать на `react-native-yamap`:

```bash
npm install react-native-yamap
npx expo prebuild
npx expo run:android
```

Но для большинства случаев WebView подход достаточен.

## Дополнительные ресурсы

- [Яндекс.Карты JavaScript API](https://tech.yandex.ru/maps/jsapi/)
- [React Native WebView](https://github.com/react-native-webview/react-native-webview)
- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)

---

**Приятной разработки! 🚀**

