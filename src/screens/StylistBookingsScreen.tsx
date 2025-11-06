/**
 * Экран управления бронированиями для стилистов
 * Отображает запросы на подтверждение и предстоящие встречи
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useBookingStore } from '../store/bookingStore';
import { useAuthStore } from '../store/authStore';
import { useStylistStore } from '../store/stylistStore';
import { supabase } from '../lib/supabase';
import BookingCard from '../components/booking/BookingCard';
import { Booking } from '../types';

export default function StylistBookingsScreen() {
  const { user } = useAuthStore();
  const { stylists, fetchStylists } = useStylistStore();
  const { bookings, loading, fetchStylistBookings, updateBookingStatus, subscribeToBookings } = useBookingStore();
  const [stylistId, setStylistId] = useState<string | null>(null);

  useEffect(() => {
    // Загружаем список стилистов, если он пуст
    if (stylists.length === 0) {
      fetchStylists();
    }
  }, []);

  useEffect(() => {
    const loadStylistData = async () => {
      if (!user) return;

      // Пробуем найти в загруженном списке
      let myStylist = stylists.find(s => s.user_id === user.id);
      
      // Если не нашли в списке, загружаем напрямую из БД
      if (!myStylist && stylists.length > 0) {
        console.log('Стилист не найден в списке, загружаем из БД...');
        console.log('User ID:', user.id);
        console.log('Список stylists user_ids:', stylists.map(s => s.user_id));
        
        // Пробуем загрузить напрямую из Supabase
        const { data, error } = await supabase
          .from('stylists')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (!error && data) {
          myStylist = {
            id: data.id,
            user_id: data.user_id,
            full_name: user.user_metadata?.full_name || 'Стилист',
            avatar_url: null,
            bio: data.bio,
            status: data.status,
            latitude: data.latitude,
            longitude: data.longitude,
            current_mall: data.current_mall,
            portfolio_images: data.portfolio_images || [],
          };
        } else {
          console.log('Ошибка загрузки стилиста:', error);
        }
      }
      
      if (myStylist) {
        setStylistId(myStylist.id);
        fetchStylistBookings(myStylist.id);
        const unsubscribe = subscribeToBookings(myStylist.id, true);
        return unsubscribe;
      }
    };

    if (user && stylists.length >= 0) {
      loadStylistData();
    }
  }, [user, stylists]);

  const handleConfirm = async (bookingId: string) => {
    Alert.alert(
      'Подтвердить встречу',
      'Вы уверены, что хотите подтвердить эту встречу?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Подтвердить',
          onPress: async () => {
            const success = await updateBookingStatus(bookingId, 'confirmed');
            if (success && stylistId) {
              fetchStylistBookings(stylistId);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (bookingId: string) => {
    Alert.alert(
      'Отклонить запрос',
      'Вы уверены, что хотите отклонить этот запрос на встречу?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Отклонить',
          style: 'destructive',
          onPress: async () => {
            const success = await updateBookingStatus(bookingId, 'rejected');
            if (success && stylistId) {
              fetchStylistBookings(stylistId);
            }
          },
        },
      ]
    );
  };

  const handleComplete = async (bookingId: string) => {
    Alert.alert(
      'Завершить встречу',
      'Отметить эту встречу как завершенную?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Завершить',
          onPress: async () => {
            const success = await updateBookingStatus(bookingId, 'completed');
            if (success && stylistId) {
              fetchStylistBookings(stylistId);
            }
          },
        },
      ]
    );
  };

  // Разделяем бронирования по статусам
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const pastBookings = bookings.filter(b => ['completed', 'rejected'].includes(b.status));

  const renderBooking = ({ item }: { item: Booking }) => (
    <BookingCard
      booking={item}
      showActions={true}
      onConfirm={item.status === 'pending' ? () => handleConfirm(item.id) : undefined}
      onReject={item.status === 'pending' ? () => handleReject(item.id) : undefined}
    />
  );

  if (loading && bookings.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  if (!stylistId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>
          Профиль стилиста не найден
        </Text>
      </View>
    );
  }

  if (bookings.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>У вас пока нет запросов на встречи</Text>
      </View>
    );
  }

  const allBookings = [...pendingBookings, ...confirmedBookings, ...pastBookings];

  return (
    <View style={styles.container}>
      <FlatList
        data={allBookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {pendingBookings.length > 0 && (
              <View style={styles.header}>
                <Text style={styles.sectionTitle}>
                  Новые запросы ({pendingBookings.length})
                </Text>
              </View>
            )}
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    paddingVertical: 8,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

