/**
 * Детальный экран профиля стилиста
 * Показывает полную информацию: фото, био, портфолио, рейтинг, статус
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useStylistStore } from '../store/stylistStore';
import { Stylist } from '../types';
import BookingModal from '../components/booking/BookingModal';

export default function StylistDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const { fetchStylistById } = useStylistStore();
  const [stylist, setStylist] = useState<Stylist | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    loadStylist();
  }, [id]);

  const loadStylist = async () => {
    setLoading(true);
    const data = await fetchStylistById(id);
    setStylist(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  if (!stylist) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Стилист не найден</Text>
      </View>
    );
  }

  const statusColor = stylist.status === 'available' ? '#4CAF50' : '#FFA726';
  const statusText = stylist.status === 'available' ? 'Свободен' : 'Занят';

  return (
    <ScrollView style={styles.container}>
      {/* Аватар */}
      {stylist.avatar_url && (
        <Image source={{ uri: stylist.avatar_url }} style={styles.avatar} />
      )}

      {/* Основная информация */}
      <View style={styles.infoSection}>
        <Text style={styles.name}>{stylist.full_name}</Text>
        
        <View style={styles.statusContainer}>
          <Text style={[styles.status, { color: statusColor }]}>
            ● {statusText}
          </Text>
        </View>

        <View style={styles.detailsRow}>
          <Text style={styles.rating}>⭐ {stylist.rating.toFixed(1)}</Text>
          <Text style={styles.mall}>📍 {stylist.current_mall}</Text>
        </View>
      </View>

      {/* Био */}
      {stylist.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>О стилисте</Text>
          <Text style={styles.bio}>{stylist.bio}</Text>
        </View>
      )}

      {/* Портфолио */}
      {stylist.portfolio_images && stylist.portfolio_images.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Портфолио</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {stylist.portfolio_images.map((imageUrl, index) => (
              <Image
                key={index}
                source={{ uri: imageUrl }}
                style={styles.portfolioImage}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Кнопка записаться */}
      <TouchableOpacity 
        style={styles.contactButton}
        onPress={() => setShowBookingModal(true)}
      >
        <Text style={styles.contactButtonText}>Записаться</Text>
      </TouchableOpacity>

      {/* Модальное окно бронирования */}
      <BookingModal
        visible={showBookingModal}
        stylistId={stylist.id}
        stylistName={stylist.full_name}
        onClose={() => setShowBookingModal(false)}
        onSuccess={() => {
          setShowBookingModal(false);
          // Можно добавить навигацию к списку бронирований
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  avatar: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  infoSection: {
    padding: 20,
    backgroundColor: 'white',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusContainer: {
    marginBottom: 12,
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
  },
  mall: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginTop: 12,
    padding: 20,
    backgroundColor: 'white',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  bio: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  portfolioImage: {
    width: 200,
    height: 250,
    borderRadius: 8,
    marginRight: 12,
  },
  contactButton: {
    margin: 20,
    backgroundColor: '#6200ee',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  contactButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

