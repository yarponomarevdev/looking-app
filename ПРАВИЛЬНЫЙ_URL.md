# ✅ Правильный URL приложения

## 🎯 Ваш проект на Vercel

**Название проекта:** `looking-web`

**Правильный URL:**
```
https://looking-web.vercel.app
```

## ❌ Неправильный URL

~~`https://looking-app.vercel.app`~~ - это чужой проект (Booking.com demo)

## 🔗 Правильный формат ссылок для шеринга

### Основной URL
```
https://looking-web.vercel.app
```

### Ссылка на образ
```
https://looking-web.vercel.app?stylist={STYLIST_ID}&look={LOOK_ID}
```

### Пример рабочей ссылки
```
https://looking-web.vercel.app?stylist=1a89bf8c-bb99-4a9b-8c9d-0d7435a8c1e6&look=4ceec4e3-dfc2-49b9-a5bd-eac0beffd102
```

## 📋 Что было исправлено

✅ Обновлен `src/navigation/AppNavigator.tsx` - все URL заменены на правильные
✅ Обновлен `src/screens/FeedScreen.tsx` - генерация ссылок использует правильный домен
✅ Обновлена документация в `docs/`

## 🚀 Следующие шаги

1. **Деплой изменений на Vercel:**
   ```bash
   git add .
   git commit -m "fix: update URLs to looking-web.vercel.app"
   git push
   ```

2. **Проверьте основной URL:**
   Откройте: https://looking-web.vercel.app
   
   Должно открыться приложение Looking (лента образов)

3. **Проверьте deep link:**
   Откройте: https://looking-web.vercel.app?stylist=1a89bf8c-bb99-4a9b-8c9d-0d7435a8c1e6&look=4ceec4e3-dfc2-49b9-a5bd-eac0beffd102
   
   Должно открыться приложение и перейти к профилю стилиста с выбранным образом

## 🔧 Как найти URL своего проекта на Vercel

1. Откройте [Vercel Dashboard](https://vercel.com/dashboard)
2. Найдите проект `looking-web`
3. URL проекта отображается в карточке проекта
4. По умолчанию это: `{project-name}.vercel.app`

## 📝 Примечание

Если вы хотите использовать кастомный домен (например, `looking.ru`):
1. Купите домен
2. Добавьте его в настройках проекта на Vercel
3. Обновите URL в коде на новый домен

