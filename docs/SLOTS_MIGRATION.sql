-- ======================================
-- SQL миграция для системы слотов бронирования
-- Выполните этот скрипт в Supabase Dashboard -> SQL Editor
-- ======================================

-- Добавляем partial unique index для предотвращения двойного бронирования
-- Один стилист не может иметь два активных бронирования на одно время
DROP INDEX IF EXISTS unique_stylist_datetime_slot;

CREATE UNIQUE INDEX unique_stylist_datetime_slot 
ON bookings (stylist_id, booking_date, booking_time)
WHERE (status IN ('pending', 'confirmed'));

-- Примечание: PostgreSQL поддерживает partial unique indexes с условием WHERE
-- Это означает, что индекс применяется только к бронированиям со статусом pending или confirmed
-- Отмененные (rejected) и завершенные (completed) бронирования не блокируют слот
-- Partial unique index работает так же как constraint, но с правильным синтаксисом

-- Создаем функцию для получения занятых слотов стилиста на конкретную дату
CREATE OR REPLACE FUNCTION get_booked_slots(
  p_stylist_id UUID,
  p_date DATE
)
RETURNS TABLE (
  booking_time TIME,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT b.booking_time, b.status
  FROM bookings b
  WHERE b.stylist_id = p_stylist_id
    AND b.booking_date = p_date
    AND b.status IN ('pending', 'confirmed')
  ORDER BY b.booking_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем функцию для проверки доступности слота
CREATE OR REPLACE FUNCTION is_slot_available(
  p_stylist_id UUID,
  p_date DATE,
  p_time TIME
)
RETURNS BOOLEAN AS $$
DECLARE
  booking_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO booking_count
  FROM bookings
  WHERE stylist_id = p_stylist_id
    AND booking_date = p_date
    AND booking_time = p_time
    AND status IN ('pending', 'confirmed');
  
  RETURN booking_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ======================================
-- Готово!
-- Теперь система предотвращает двойное бронирование
-- ======================================

