-- Миграция для добавления таблицы push_subscriptions
-- Хранит подписки пользователей на push-уведомления

-- Создаем таблицу для подписок на push-уведомления
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Уникальная подписка для каждого пользователя и endpoint
  UNIQUE(user_id, endpoint)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- RLS политики
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Пользователь может читать только свои подписки
CREATE POLICY "Users can view own subscriptions"
  ON push_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Пользователь может создавать свои подписки
CREATE POLICY "Users can create own subscriptions"
  ON push_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Пользователь может обновлять свои подписки
CREATE POLICY "Users can update own subscriptions"
  ON push_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Пользователь может удалять свои подписки
CREATE POLICY "Users can delete own subscriptions"
  ON push_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();

-- Комментарии
COMMENT ON TABLE push_subscriptions IS 'Хранит подписки пользователей на push-уведомления для PWA';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'Уникальный endpoint подписки от браузера';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'Публичный ключ для шифрования (p256dh)';
COMMENT ON COLUMN push_subscriptions.auth IS 'Секретный ключ аутентификации';

