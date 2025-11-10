# Устранение проблем с Deep Links

## Проблема: Открывается Booking.com вместо приложения

Если при открытии ссылки `https://looking-app.vercel.app?stylist=xxx&look=yyy` вместо приложения Looking открывается Booking.com, это может быть вызвано следующими причинами:

### 1. Проблема с DNS или кэшем браузера

**Решение:**
- Очистите кэш браузера (Ctrl+Shift+Del)
- Откройте ссылку в режиме инкогнито
- Попробуйте другой браузер
- Проверьте DNS кэш:
  ```bash
  # Windows
  ipconfig /flushdns
  
  # macOS
  sudo dscacheutil -flushcache
  
  # Linux
  sudo systemd-resolve --flush-caches
  ```

### 2. Проблема с развертыванием на Vercel

**Проверка:**
1. Откройте https://looking-app.vercel.app (без параметров)
2. Должно открыться ваше приложение Looking
3. Если открывается другой сайт - проверьте настройки проекта в Vercel

**Решение:**
- Проверьте, что проект развернут на правильном домене в Vercel
- Убедитесь, что последний коммит задеплоен
- Проверьте логи развертывания в Vercel Dashboard

### 3. Redirect от предыдущих настроек

**Проверка:**
- Откройте инструменты разработчика (F12)
- Перейдите на вкладку Network
- Откройте ссылку
- Проверьте, есть ли HTTP редирект (статус 301 или 302)

**Решение:**
- Удалите все redirects в настройках Vercel
- Проверьте файл `vercel.json` на наличие нежелательных redirects

## Текущая конфигурация

### vercel.json
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Эта конфигурация должна перенаправлять все запросы на `index.html`, что правильно для SPA.

## Как должны работать Deep Links

### Формат ссылки
```
https://looking-app.vercel.app?stylist={STYLIST_ID}&look={LOOK_ID}
```

### Ожидаемое поведение

1. Пользователь открывает ссылку
2. Загружается приложение Looking
3. После загрузки автоматически:
   - Открывается профиль стилиста
   - Показывается выбранный образ
   - Если пользователь авторизован - открывается модальное окно бронирования
   - Если нет - предлагается войти

### Логи для отладки

В консоли браузера (F12 → Console) должны появиться логи:
```
Deep link parsed: {
  path: "?stylist=xxx&look=yyy",
  stylistId: "xxx",
  lookId: "yyy"
}
```

Если логов нет - проблема с обработкой URL.

## Проверка работоспособности

### Шаг 1: Проверьте базовый URL
```
https://looking-app.vercel.app
```
Должно открыться приложение Looking (лента образов).

### Шаг 2: Проверьте navigation
В консоли браузера выполните:
```javascript
window.location.href
```
Должно показать правильный URL приложения.

### Шаг 3: Проверьте deep link вручную

1. Откройте приложение: `https://looking-app.vercel.app`
2. Откройте консоль (F12)
3. Выполните:
```javascript
window.location.href = "https://looking-app.vercel.app?stylist=1a89bf8c-bb99-4a9b-8c9d-0d7435a8c1e6&look=4ceec4e3-dfc2-49b9-a5bd-eac0beffd102"
```
4. Приложение должно перейти к профилю стилиста с образом

### Шаг 4: Проверьте React Navigation

В консоли должны быть логи от React Navigation:
```
Deep link parsed: { ... }
```

Если нет - проблема с конфигурацией linking.

## Исправленный код

### AppNavigator.tsx - Улучшенная обработка deep links

```typescript
const linking = React.useMemo(() => ({
  prefixes: ['https://looking-app.vercel.app', 'http://looking-app.vercel.app', 'looking-app://'],
  config: {
    screens: {
      Main: {
        path: '',
        screens: {
          Feed: 'feed',
          Map: 'map',
          List: 'list',
          Profile: 'profile',
        },
      },
      StylistDetail: {
        path: 'stylist/:id',
        parse: {
          id: (id: string) => id,
          selectedLookId: (lookId: string) => lookId,
        },
      },
    },
  },
  getStateFromPath: (path: string, config: any) => {
    try {
      let urlObj: URL;
      
      if (path.startsWith('http')) {
        urlObj = new URL(path);
      } else if (path.startsWith('/')) {
        urlObj = new URL(`https://looking-app.vercel.app${path}`);
      } else if (path.includes('?')) {
        urlObj = new URL(`https://looking-app.vercel.app/?${path.split('?')[1]}`);
      } else {
        urlObj = new URL(`https://looking-app.vercel.app/${path}`);
      }
      
      const stylistId = urlObj.searchParams.get('stylist');
      const lookId = urlObj.searchParams.get('look');
      
      console.log('Deep link parsed:', { path, stylistId, lookId });
      
      if (stylistId && lookId) {
        return {
          routes: [
            { name: 'Main' },
            {
              name: 'StylistDetail',
              params: {
                id: stylistId,
                selectedLookId: lookId,
              },
            },
          ],
        };
      }
    } catch (error) {
      console.error('Error parsing deep link:', error);
    }
    
    return undefined;
  },
}), []);
```

## Тестирование в разных браузерах

### Chrome/Edge
1. Откройте ссылку в новой вкладке
2. Проверьте консоль на наличие ошибок
3. Проверьте Network tab на redirects

### Firefox
1. Откройте ссылку в новой вкладке
2. Проверьте консоль
3. Firefox может кэшировать DNS агрессивнее - попробуйте `about:networking#dns` и очистите кэш

### Safari
1. Откройте ссылку
2. Safari может иметь проблемы с SPA routing
3. Проверьте Safari Web Inspector

## Дополнительные проверки

### 1. Проверьте Vercel Dashboard

1. Войдите в Vercel Dashboard
2. Откройте проект looking-app
3. Проверьте:
   - Deployments - последний деплой должен быть успешным
   - Domains - должен быть looking-app.vercel.app
   - Settings → Redirects - не должно быть redirects

### 2. Проверьте package.json скрипты

Убедитесь, что билд команда правильная:
```json
{
  "scripts": {
    "build": "npx expo export --platform web && npm run postbuild",
    "postbuild": "node scripts/postbuild-web.js"
  }
}
```

### 3. Проверьте dist папку

После сборки в `dist/index.html` должен быть:
- Правильный путь к бандлу
- Meta теги для PWA
- Правильный base URL

## Если ничего не помогло

1. **Полная пересборка:**
```bash
rm -rf dist node_modules
npm install
npm run build
```

2. **Передеплой на Vercel:**
```bash
git add .
git commit -m "fix: deep links configuration"
git push
```

3. **Проверьте логи Vercel:**
- Откройте проект в Vercel
- Перейдите в Deployments
- Откройте последний deployment
- Проверьте Build Logs

4. **Альтернативный формат ссылки:**
Если query параметры не работают, можно попробовать path параметры:
```
https://looking-app.vercel.app/stylist/1a89bf8c-bb99-4a9b-8c9d-0d7435a8c1e6?look=4ceec4e3-dfc2-49b9-a5bd-eac0beffd102
```

## Контрольный список

- [ ] Базовый URL открывает приложение Looking
- [ ] Консоль показывает логи deep link parsing
- [ ] Нет HTTP redirects в Network tab
- [ ] DNS кэш очищен
- [ ] Попробовано в режиме инкогнито
- [ ] Последний коммит задеплоен на Vercel
- [ ] vercel.json содержит правильные rewrites
- [ ] Попробовано в разных браузерах

## Поддержка

Если проблема сохраняется:
1. Откройте DevTools (F12)
2. Скопируйте все логи из Console
3. Скопируйте все запросы из Network tab
4. Предоставьте screenshot с ошибкой

