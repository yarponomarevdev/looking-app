-- Исправление политик безопасности для уведомлений
-- Выполните этот скрипт в Supabase SQL Editor

-- 1. Убедимся, что RLS включен
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 2. Пересоздадим политику обновления с явным указанием прав
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can update own notifications" 
  ON notifications FOR UPDATE 
  USING (auth.uid() = user_id);

-- 3. Убедимся, что политика просмотра правильная
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;

CREATE POLICY "Users can view own notifications" 
  ON notifications FOR SELECT 
  USING (auth.uid() = user_id);

