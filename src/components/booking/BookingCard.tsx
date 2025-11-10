/**
 * Компонент карточки бронирования
 * Отображает информацию о бронировании со статусом
 */

import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Booking } from '../../types';

interface BookingCardProps {
  booking: Booking;
  onPress?: () => void;
  showActions?: boolean;
  onConfirm?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
}

export default function BookingCard({ 
  booking, 
  onPress, 
  showActions = false,
  onConfirm,
  onReject,
  onCancel
}: BookingCardProps) {
  const getStatusColor = () => {
    switch (booking.status) {
      case 'confirmed': return '#4CAF50';
      case 'pending': return '#FFA726';
      case 'rejected': return '#F44336';
      case 'completed': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = () => {
    switch (booking.status) {
      case 'confirmed': return 'Подтверждено';
      case 'pending': return 'Ожидает подтверждения';
      case 'rejected': return 'Отклонено';
      case 'completed': return 'Завершено';
      default: return booking.status;
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // HH:MM
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Статус */}
      <View style={[styles.statusBar, { backgroundColor: getStatusColor() }]}>
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>

      {/* Основная информация */}
      <View style={styles.content}>
        {/* Аватар и имя */}
        <View style={styles.header}>
          {(booking.stylist?.avatar_url || booking.client?.avatar_url) && (
            <Image 
              source={{ uri: booking.stylist?.avatar_url || booking.client?.avatar_url || '' }} 
              style={styles.avatar} 
            />
          )}
          <View style={styles.info}>
            <Text style={styles.name}>
              {booking.stylist?.full_name || booking.client?.full_name || 'Без имени'}
            </Text>
          </View>
        </View>

        {/* Детали встречи */}
        <View style={styles.details}>
          <Text style={styles.detailText}>📅 {formatDate(booking.booking_date)}</Text>
          <Text style={styles.detailText}>🕐 {formatTime(booking.booking_time)}</Text>
          <Text style={styles.detailText}>📍 {booking.mall}</Text>
        </View>

        {/* Комментарий */}
        {booking.comment && (
          <View style={styles.commentContainer}>
            <Text style={styles.commentLabel}>Комментарий:</Text>
            <Text style={styles.commentText}>{booking.comment}</Text>
          </View>
        )}

        {/* Действия */}
        {showActions && booking.status === 'pending' && (
          <View style={styles.actions}>
            {onConfirm && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.confirmButton]}
                onPress={onConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>Подтвердить</Text>
              </TouchableOpacity>
            )}
            {onReject && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.rejectButton]}
                onPress={onReject}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>Отклонить</Text>
              </TouchableOpacity>
            )}
            {onCancel && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={onCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>Отменить</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    elevation: 2,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  statusBar: {
    padding: 8,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  details: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 6,
  },
  commentContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  commentLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  cancelButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});

