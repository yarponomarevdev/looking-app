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

  const statusColor = stylist.status === 'active' ? '#4CAF50' : '#999';
  const statusText = stylist.status === 'active' ? 'Активен' : 'Не активен';

  return (
    <ScrollView style={styles.container}>
      {/* Аватар */}
      {stylist.avatar_url ? (
        <Image source={{ uri: stylist.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarPlaceholderText}>
            {stylist.full_name?.charAt(0).toUpperCase() || 'С'}
          </Text>
        </View>
      )}

      {/* Основная информация */}
      <View style={styles.infoSection}>
        <Text style={styles.name}>{stylist.full_name}</Text>
        
        <View style={styles.statusContainer}>
          <Text style={[styles.status, { color: statusColor }]}>
            ● {statusText}
          </Text>
        </View>

        {/* Торговые центры */}
        {stylist.malls && stylist.malls.length > 0 && (
          <View style={styles.mallsContainer}>
            <Text style={styles.mallsLabel}>📍 Работает в:</Text>
            <View style={styles.mallsList}>
              {stylist.malls.map((mall, index) => (
                <Text key={index} style={styles.mallItem}>• {mall}</Text>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Био */}
      {stylist.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>О стилисте</Text>
          <Text style={styles.bio}>{stylist.bio}</Text>
        </View>
      )}

      {/* Бренды */}
      {stylist.brands && stylist.brands.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Специализация по брендам</Text>
          <View style={styles.brandsContainer}>
            {stylist.brands.map((brand, index) => (
              <View key={index} style={styles.brandTag}>
                <Text style={styles.brandText}>{brand}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* График работы */}
      {stylist.work_schedule && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>График работы</Text>
          {Object.entries(stylist.work_schedule).map(([day, schedule]) => {
            if (!schedule.enabled) return null;
            const dayNames: {[key: string]: string} = {
              monday: 'Понедельник',
              tuesday: 'Вторник',
              wednesday: 'Среда',
              thursday: 'Четверг',
              friday: 'Пятница',
              saturday: 'Суббота',
              sunday: 'Воскресенье',
            };
            return (
              <View key={day} style={styles.scheduleItem}>
                <Text style={styles.scheduleDay}>{dayNames[day]}</Text>
                <Text style={styles.scheduleTime}>{schedule.start} — {schedule.end}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Социальные сети */}
      {stylist.social_links && Object.keys(stylist.social_links).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Связаться</Text>
          {stylist.social_links.instagram && (
            <TouchableOpacity style={styles.socialLink}>
              <Text style={styles.socialIcon}>📷</Text>
              <Text style={styles.socialText}>Instagram: @{stylist.social_links.instagram}</Text>
            </TouchableOpacity>
          )}
          {stylist.social_links.vk && (
            <TouchableOpacity style={styles.socialLink}>
              <Text style={styles.socialIcon}>🔵</Text>
              <Text style={styles.socialText}>VK: {stylist.social_links.vk}</Text>
            </TouchableOpacity>
          )}
          {stylist.social_links.telegram && (
            <TouchableOpacity style={styles.socialLink}>
              <Text style={styles.socialIcon}>✈️</Text>
              <Text style={styles.socialText}>Telegram: {stylist.social_links.telegram}</Text>
            </TouchableOpacity>
          )}
          {stylist.social_links.whatsapp && (
            <TouchableOpacity style={styles.socialLink}>
              <Text style={styles.socialIcon}>💬</Text>
              <Text style={styles.socialText}>WhatsApp: {stylist.social_links.whatsapp}</Text>
            </TouchableOpacity>
          )}
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
  avatarPlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 120,
    color: 'white',
    fontWeight: 'bold',
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
  mallsContainer: {
    marginTop: 12,
  },
  mallsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  mallsList: {
    gap: 4,
  },
  mallItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
  brandsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  brandTag: {
    backgroundColor: '#e8e8e8',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  brandText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  scheduleDay: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  scheduleTime: {
    fontSize: 15,
    color: '#666',
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  socialIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  socialText: {
    fontSize: 15,
    color: '#6200ee',
    flex: 1,
  },
});

