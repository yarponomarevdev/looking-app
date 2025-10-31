/**
 * Модальное окно для бронирования встречи со стилистом
 * Включает выбор даты, времени, места встречи и комментария
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { MOSCOW_MALLS } from '../../constants/malls';
import { useBookingStore } from '../../store/bookingStore';
import { useAuthStore } from '../../store/authStore';

interface BookingModalProps {
  visible: boolean;
  stylistId: string;
  stylistName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BookingModal({ 
  visible, 
  stylistId, 
  stylistName,
  onClose, 
  onSuccess 
}: BookingModalProps) {
  const { user } = useAuthStore();
  const { createBooking, loading } = useBookingStore();

  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedMall, setSelectedMall] = useState(MOSCOW_MALLS[0]);
  const [comment, setComment] = useState('');

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Ошибка', 'Необходимо войти в систему');
      return;
    }

    // Форматируем дату и время
    const bookingDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const bookingTime = time.toTimeString().split(' ')[0].slice(0, 5); // HH:MM

    const result = await createBooking({
      client_id: user.id,
      stylist_id: stylistId,
      booking_date: bookingDate,
      booking_time: bookingTime,
      mall: selectedMall,
      comment: comment.trim() || undefined,
    });

    if (result) {
      Alert.alert(
        'Успешно!', 
        `Запрос на встречу с ${stylistName} отправлен. Ожидайте подтверждения.`,
        [{ text: 'OK', onPress: () => {
          onSuccess?.();
          onClose();
        }}]
      );
      
      // Сброс формы
      setDate(new Date());
      setTime(new Date());
      setComment('');
      setSelectedMall(MOSCOW_MALLS[0]);
    } else {
      Alert.alert('Ошибка', 'Не удалось создать бронирование. Попробуйте снова.');
    }
  };

  const onDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onTimeChange = (_event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
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

            {/* Выбор времени */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Время встречи</Text>
              <TouchableOpacity 
                style={styles.input} 
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.inputText}>🕐 {formatTime(time)}</Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={time}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onTimeChange}
                  minuteInterval={30}
                />
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
                  {MOSCOW_MALLS.map((mall) => (
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
});

