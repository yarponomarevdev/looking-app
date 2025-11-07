/**
 * Модальное окно для бронирования встречи со стилистом
 * Включает выбор даты, времени, места встречи и комментария
 * Показывает только доступные слоты с учетом графика работы
 * Поддерживает бронирование как с привязкой к конкретному образу, так и без
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  Platform,
  ActivityIndicator
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { MOSCOW_MALLS } from '../../constants/malls';
import { useBookingStore, TimeSlot } from '../../store/bookingStore';
import { useAuthStore } from '../../store/authStore';
import { useStylistStore } from '../../store/stylistStore';
import { WorkSchedule } from '../../types';
import { useAlert } from '../alert/AlertProvider';

interface BookingModalProps {
  visible: boolean;
  stylistId: string;
  stylistName: string;
  selectedLookId?: string; // ID выбранного образа (опционально)
  selectedLookTitle?: string; // Название выбранного образа (опционально)
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BookingModal({ 
  visible, 
  stylistId, 
  stylistName,
  selectedLookId,
  selectedLookTitle,
  onClose, 
  onSuccess 
}: BookingModalProps) {
  const { user } = useAuthStore();
  const { createBooking, loading, getAvailableSlots, error: bookingError } = useBookingStore();
  const { fetchStylistById } = useStylistStore();
  const { showAlert } = useAlert();

  const [date, setDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedMall, setSelectedMall] = useState<string>('');
  const [comment, setComment] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule | null>(null);
  const [stylistMalls, setStylistMalls] = useState<string[]>(MOSCOW_MALLS);

  // Загружаем график работы стилиста при открытии модального окна
  useEffect(() => {
    if (visible && stylistId) {
      loadStylistSchedule();
    }
  }, [visible, stylistId]);

  // Загружаем доступные слоты при изменении даты
  useEffect(() => {
    if (workSchedule && date) {
      loadAvailableSlots();
    }
  }, [date, workSchedule]);

  /**
   * Загружает график работы стилиста и его торговые центры
   */
  const loadStylistSchedule = async () => {
    try {
      const stylist = await fetchStylistById(stylistId);
      if (stylist) {
        // Сохраняем график работы
        if (stylist.work_schedule) {
          setWorkSchedule(stylist.work_schedule);
        }
        
        // Сохраняем список торговых центров стилиста
        if (stylist.malls && stylist.malls.length > 0) {
          setStylistMalls(stylist.malls);
          // Устанавливаем первый ТЦ как выбранный по умолчанию
          if (!selectedMall) {
            setSelectedMall(stylist.malls[0]);
          }
        } else {
          // Если у стилиста не указаны ТЦ, используем все доступные
          setStylistMalls(MOSCOW_MALLS);
          if (!selectedMall) {
            setSelectedMall(MOSCOW_MALLS[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading stylist schedule:', error);
    }
  };

  /**
   * Загружает доступные слоты для выбранной даты
   */
  const loadAvailableSlots = async () => {
    if (!workSchedule) return;
    
    setLoadingSlots(true);
    const bookingDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    try {
      const slots = await getAvailableSlots(stylistId, bookingDate, workSchedule);
      setAvailableSlots(slots);
      
      // Сбрасываем выбранное время если оно стало недоступно
      if (selectedTime && !slots.find(s => s.time === selectedTime && s.available)) {
        setSelectedTime(null);
      }
    } catch (error) {
      console.error('Error loading available slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      showAlert('Ошибка', 'Необходимо войти в систему');
      return;
    }

    if (!selectedTime) {
      showAlert('Ошибка', 'Выберите время встречи');
      return;
    }

    // Форматируем дату и время
    const bookingDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const bookingTime = selectedTime; // HH:MM

    const result = await createBooking({
      client_id: user.id,
      stylist_id: stylistId,
      booking_date: bookingDate,
      booking_time: bookingTime,
      mall: selectedMall,
      comment: comment.trim() || undefined,
      look_id: selectedLookId, // Передаем ID образа, если выбран
    });

    if (result) {
      showAlert(
        'Успешно!', 
        `Запрос на встречу с ${stylistName} отправлен. Ожидайте подтверждения.`,
        [{ text: 'OK', onPress: () => {
          onSuccess?.();
          onClose();
        }}]
      );
      
      // Сброс формы
      setDate(new Date());
      setSelectedTime(null);
      setComment('');
      setSelectedMall(stylistMalls[0] || '');
    } else {
      // Показываем конкретную ошибку из store или общее сообщение
      showAlert(
        'Ошибка', 
        bookingError || 'Не удалось создать бронирование. Попробуйте снова.'
      );
      
      // Обновляем слоты, чтобы показать актуальное состояние
      loadAvailableSlots();
    }
  };

  const onDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
      setSelectedTime(null); // Сбрасываем выбранное время при смене даты
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Заголовок */}
          <View style={styles.header}>
            <Text style={styles.title}>Записаться к стилисту</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Имя стилиста */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Стилист</Text>
              <Text style={styles.stylistName}>{stylistName}</Text>
            </View>

            {/* Информация о выбранном образе */}
            {selectedLookId && selectedLookTitle && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Выбранный образ</Text>
                <View style={styles.lookInfoBox}>
                  <Text style={styles.lookInfoIcon}>✨</Text>
                  <Text style={styles.lookInfoText}>{selectedLookTitle}</Text>
                </View>
                <Text style={styles.lookInfoNote}>
                  Вы записываетесь на консультацию по этому образу
                </Text>
              </View>
            )}

            {/* Выбор даты */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Дата встречи</Text>
              <TouchableOpacity 
                style={styles.input} 
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.inputText}>📅 {formatDate(date)}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>

            {/* Выбор времени - слоты */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Время встречи</Text>
              
              {loadingSlots ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#6200ee" />
                  <Text style={styles.loadingText}>Загрузка слотов...</Text>
                </View>
              ) : availableSlots.length === 0 ? (
                <View style={styles.noSlotsContainer}>
                  <Text style={styles.noSlotsText}>
                    В этот день стилист не работает или все слоты заняты
                  </Text>
                </View>
              ) : (
                <View style={styles.slotsGrid}>
                  {availableSlots.map((slot) => (
                    <TouchableOpacity
                      key={slot.time}
                      style={[
                        styles.slotButton,
                        !slot.available && styles.slotButtonDisabled,
                        selectedTime === slot.time && styles.slotButtonSelected,
                      ]}
                      onPress={() => slot.available && setSelectedTime(slot.time)}
                      disabled={!slot.available}
                    >
                      <Text
                        style={[
                          styles.slotButtonText,
                          !slot.available && styles.slotButtonTextDisabled,
                          selectedTime === slot.time && styles.slotButtonTextSelected,
                        ]}
                      >
                        {slot.time}
                      </Text>
                      {!slot.available && (
                        <Text style={styles.slotStatusText}>
                          {slot.status === 'confirmed' ? '✓' : '⏱'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Выбор ТЦ */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Место встречи</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedMall}
                  onValueChange={(value) => setSelectedMall(value)}
                  style={styles.picker}
                >
                  {stylistMalls.map((mall) => (
                    <Picker.Item key={mall} label={mall} value={mall} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Комментарий */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Комментарий (необязательно)</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                placeholder="Например: Хочу подобрать вечерний образ"
                value={comment}
                onChangeText={setComment}
                maxLength={500}
              />
            </View>
          </ScrollView>

          {/* Кнопки */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Отменить</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.submitButton]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Отправка...' : 'Забронировать'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  stylistName: {
    fontSize: 18,
    color: '#6200ee',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#f9f9f9',
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#6200ee',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  noSlotsContainer: {
    padding: 20,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  noSlotsText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6200ee',
    backgroundColor: 'white',
    minWidth: 80,
    alignItems: 'center',
  },
  slotButtonDisabled: {
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  slotButtonSelected: {
    backgroundColor: '#6200ee',
    borderColor: '#6200ee',
  },
  slotButtonText: {
    fontSize: 16,
    color: '#6200ee',
    fontWeight: '600',
  },
  slotButtonTextDisabled: {
    color: '#999',
  },
  slotButtonTextSelected: {
    color: 'white',
  },
  slotStatusText: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  lookInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ce93d8',
  },
  lookInfoIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  lookInfoText: {
    fontSize: 16,
    color: '#6200ee',
    fontWeight: '600',
    flex: 1,
  },
  lookInfoNote: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
    fontStyle: 'italic',
  },
});

