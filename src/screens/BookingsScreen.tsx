/**
 * Экран со списком бронирований для клиента
 * Отображает предстоящие и прошедшие встречи
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useBookingStore } from '../store/bookingStore';
import { useAuthStore } from '../store/authStore';
import BookingCard from '../components/booking/BookingCard';
import { Booking } from '../types';

export default function BookingsScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { bookings, loading, fetchMyBookings, cancelBooking, subscribeToBookings } = useBookingStore();

  useEffect(() => {
    if (user) {
      fetchMyBookings(user.id);
      const unsubscribe = subscribeToBookings(user.id, false);
      return unsubscribe;
    }
  }, [user]);

  const handleCancel = async (bookingId: string) => {
    const success = await cancelBooking(bookingId);
    if (success) {
      // Обновляем список
      if (user) {
        fetchMyBookings(user.id);
      }
    }
  };

  const handleCardPress = (booking: Booking) => {
    if (booking.stylist) {
      navigation.navigate('StylistDetail', { id: booking.stylist.id });
    }
  };

  // Разделяем бронирования на предстоящие и прошедшие
  const upcomingBookings = bookings.filter(
    b => ['pending', 'confirmed'].includes(b.status)
  );
  const pastBookings = bookings.filter(
    b => ['completed', 'rejected'].includes(b.status)
  );

  const renderBooking = ({ item }: { item: Booking }) => (
    <BookingCard
      booking={item}
      onPress={() => handleCardPress(item)}
      showActions={item.status === 'pending'}
      onCancel={() => handleCancel(item.id)}
    />
  );

  if (loading && bookings.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  if (bookings.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>У вас пока нет бронирований</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Main', { screen: 'Map' })}
        >
          <Text style={styles.buttonText}>Найти стилиста</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={[...upcomingBookings, ...pastBookings]}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            {upcomingBookings.length > 0 && (
              <Text style={styles.sectionTitle}>Предстоящие встречи</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>Нет бронирований</Text>
          </View>
        }
        ItemSeparatorComponent={() => {
          // Разделитель между секциями
          const index = upcomingBookings.length;
          if (bookings[index]?.status === 'completed' || bookings[index]?.status === 'rejected') {
            return (
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionTitle}>История</Text>
              </View>
            );
          }
          return null;
        }}
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
  sectionDivider: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

