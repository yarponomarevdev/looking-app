# Настройка переменных окружения

## Быстрая настройка Supabase

1. Создайте файл `.env` в корневой директории проекта `looking-app/`:

```bash
# Для Windows (PowerShell)
New-Item -Path .env -ItemType File

# Для macOS/Linux
touch .env
```

2. Откройте файл `.env` и добавьте следующее содержимое:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://ваш-проект.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=ваш_анон_ключ
```

3. Замените значения на ваши реальные ключи из Supabase

## Как получить ключи Supabase

1. Перейдите на [Supabase](https://supabase.com)
2. Войдите в свой проект
3. **Settings** → **API**
4. Скопируйте:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Настройка Яндекс.Карт (опционально)

> **Примечание:** API ключ Яндекс.Карт уже жестко закодирован в приложении.
> Для production рекомендуется получить собственный ключ.

### Получить собственный ключ

1. Перейдите на [Яндекс.Карты для разработчиков](https://developer.tech.yandex.ru/)
2. Войдите в свой аккаунт Яндекс
3. Создайте новый ключ для **JavaScript API и HTTP Геокодер**
4. Скопируйте ключ
5. Замените в `src/screens/MapScreen.tsx` (строка 92):

```javascript
<script src="https://api-maps.yandex.ru/2.1/?apikey=ВАШ_КЛЮЧ&lang=ru_RU"></script>
```

## Важные замечания

- ❗ Файл `.env` уже добавлен в `.gitignore` и **НЕ будет** загружен в Git
- ✅ Используйте префикс `EXPO_PUBLIC_` для доступа к переменным в коде
- 📝 При развертывании на сервере создайте файл `.env` там же
- 🔄 После изменения `.env` перезапустите: `npx expo start -c`

## Проверка настройки

После создания файла `.env` запустите:

```bash
npx expo start
```

Если все настроено правильно:
- ✅ Авторизация работает
- ✅ Яндекс.Карты загружаются
- ✅ Real-time обновления работают

## Решение проблем

### Ошибка "Supabase URL not defined"

Решение:
1. Проверьте префикс `EXPO_PUBLIC_` в `.env`
2. Очистите кеш Metro: `npx expo start -c`
3. Перезапустите приложение

### Карта не загружается

Проверьте:
1. Интернет-соединение активно
2. API ключ в `MapScreen.tsx` корректен
3. Консоль браузера не показывает ошибок CORS

