/**
 * Кастомный календарь для выбора даты
 * Решает проблемы с нативным HTML5 date picker и временными зонами
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WorkSchedule } from '../../types';

interface CustomCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  minDate?: Date;
  workSchedule?: WorkSchedule; // График работы стилиста
}

export default function CustomCalendar({ 
  selectedDate, 
  onDateChange,
  minDate = new Date(),
  workSchedule
}: CustomCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  /**
   * Получает дни для отображения в календаре
   */
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Первый день месяца
    const firstDay = new Date(year, month, 1);
    // Последний день месяца
    const lastDay = new Date(year, month + 1, 0);
    
    // День недели первого дня (0 = воскресенье, нужно преобразовать к понедельнику = 0)
    let firstDayOfWeek = firstDay.getDay() - 1;
    if (firstDayOfWeek === -1) firstDayOfWeek = 6; // воскресенье в конец
    
    const daysInMonth = lastDay.getDate();
    const days: (Date | null)[] = [];
    
    // Добавляем пустые ячейки для дней предыдущего месяца
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Добавляем дни текущего месяца
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  /**
   * Проверяет, является ли дата выбранной
   */
  const isSelectedDate = (date: Date | null) => {
    if (!date) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  /**
   * Проверяет, является ли дата сегодняшней
   */
  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  /**
   * Проверяет, доступна ли дата для выбора
   */
  const isDateAvailable = (date: Date | null) => {
    if (!date) return false;
    
    // Сравниваем только даты, без времени
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const minDateOnly = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    
    // Проверяем, что дата не в прошлом
    if (dateOnly < minDateOnly) return false;
    
    // Если есть график работы, проверяем, работает ли стилист в этот день
    if (workSchedule) {
      const dayNames: Array<keyof WorkSchedule> = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[date.getDay()];
      const daySchedule = workSchedule[dayName];
      
      // Если день не включен в график, дата недоступна
      if (!daySchedule || !daySchedule.enabled) {
        return false;
      }
    }
    
    return true;
  };

  /**
   * Переход к предыдущему месяцу
   */
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  /**
   * Переход к следующему месяцу
   */
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  /**
   * Переход к сегодняшней дате
   */
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    onDateChange(today);
  };

  /**
   * Обработка выбора даты
   */
  const handleDateSelect = (date: Date | null) => {
    if (date && isDateAvailable(date)) {
      onDateChange(date);
    }
  };

  const calendarDays = getCalendarDays();

  return (
    <View style={styles.container}>
      {/* Заголовок с навигацией */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <Text style={styles.navButtonText}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.monthYearContainer}>
          <Text style={styles.monthYear}>
            {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
        </View>
        
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <Text style={styles.navButtonText}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Кнопка "Сегодня" */}
      <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
        <Text style={styles.todayButtonText}>Сегодня</Text>
      </TouchableOpacity>

      {/* Дни недели */}
      <View style={styles.daysOfWeekRow}>
        {daysOfWeek.map((day, index) => (
          <View key={index} style={styles.dayOfWeekCell}>
            <Text style={styles.dayOfWeekText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Сетка дней */}
      <View style={styles.daysGrid}>
        {calendarDays.map((date, index) => {
          const isSelected = isSelectedDate(date);
          const isTodayDate = isToday(date);
          const isAvailable = isDateAvailable(date);
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                isSelected && styles.dayCellSelected,
                isTodayDate && !isSelected && styles.dayCellToday,
                !isAvailable && styles.dayCellDisabled,
              ]}
              onPress={() => handleDateSelect(date)}
              disabled={!date || !isAvailable}
            >
              {date && (
                <Text
                  style={[
                    styles.dayText,
                    isSelected && styles.dayTextSelected,
                    isTodayDate && !isSelected && styles.dayTextToday,
                    !isAvailable && styles.dayTextDisabled,
                  ]}
                >
                  {date.getDate()}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  navButtonText: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  },
  monthYearContainer: {
    flex: 1,
    alignItems: 'center',
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  todayButton: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    marginBottom: 12,
  },
  todayButtonText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayOfWeekCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayOfWeekText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 100% / 7 дней
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: '#6200ee',
  },
  dayCellToday: {
    backgroundColor: '#f3e5f5',
    borderWidth: 2,
    borderColor: '#6200ee',
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  dayTextSelected: {
    color: 'white',
    fontWeight: '700',
  },
  dayTextToday: {
    color: '#6200ee',
    fontWeight: '700',
  },
  dayTextDisabled: {
    color: '#999',
  },
});

