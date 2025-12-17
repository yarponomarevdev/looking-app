# Папка supabase/ - Backend конфигурация

Конфигурация и функции для Supabase backend.

## Структура

```
supabase/
├── config.toml          # Конфигурация Supabase проекта
└── functions/           # Edge Functions (serverless функции)
    └── send-push-notification/
        ├── index.ts     # Код функции отправки push-уведомлений
        └── README.md    # Документация функции
```

## config.toml

Конфигурационный файл Supabase проекта. Содержит настройки:
- Database настройки
- Auth конфигурация
- Storage настройки
- Edge Functions конфигурация

Используется Supabase CLI для локальной разработки и деплоя.

## functions/ - Edge Functions

Serverless функции, выполняющиеся на Supabase Edge Runtime (Deno).

### send-push-notification/

Функция для отправки push-уведомлений пользователям.

#### index.ts

Основной код функции:
- Принимает данные о пользователе и сообщении
- Получает push-подписки пользователя из БД
- Отправляет уведомления через Web Push API
- Обрабатывает ошибки и невалидные подписки

#### README.md

Документация функции:
- Описание назначения
- Параметры запроса
- Примеры использования
- Настройка переменных окружения

### Использование Edge Functions

Функции вызываются из приложения через Supabase клиент:

```typescript
const { data, error } = await supabase.functions.invoke('send-push-notification', {
  body: { userId, title, message }
});
```

### Триггеры в БД

Функции могут вызываться автоматически через database triggers:
- При создании бронирования
- При изменении статуса бронирования
- При создании уведомления

## Миграции базы данных

SQL миграции находятся в корне проекта:
- `supabase-migration.sql` - основная миграция со схемой БД

Миграции применяются через Supabase Dashboard или CLI.

## Безопасность

- Edge Functions используют Service Role Key для доступа к БD
- Ключи хранятся в Supabase Vault (секреты)
- RLS (Row Level Security) политики защищают данные
- Анонимный ключ используется только в клиентском приложении

