/**
 * Детальный экран профиля стилиста
 * Показывает полную информацию: фото, био, образы, портфолио, статус
 * Отображает образы стилиста с брендами и ценами
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { useStylistStore } from '../store/stylistStore';
import { useLookStore } from '../store/lookStore';
import { Stylist, StylistLook } from '../types';
import BookingModal from '../components/booking/BookingModal';
import { useAlert } from '../components/alert/AlertProvider';

export default function StylistDetailScreen({ route, navigation }: any) {
  const { id, selectedLookId } = route.params;
  const { fetchStylistById } = useStylistStore();
  const { fetchStylistLooks } = useLookStore();
  const { showAlert } = useAlert();
  const [stylist, setStylist] = useState<Stylist | null>(null);
  const [looks, setLooks] = useState<StylistLook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedLook, setSelectedLook] = useState<StylistLook | null>(null);

  useEffect(() => {
    loadStylist();
  }, [id]);

  // Автоматически открываем модальное окно бронирования, если передан образ
  useEffect(() => {
    if (selectedLookId && stylist && looks.length > 0) {
      const look = looks.find(l => l.id === selectedLookId);
      if (look) {
        setSelectedLook(look);
        setShowBookingModal(true);
      }
    }
  }, [selectedLookId, stylist, looks]);

  const loadStylist = async () => {
    setLoading(true);
    const data = await fetchStylistById(id);
    setStylist(data);
    
    // Загружаем образы стилиста
    const stylistLooks = await fetchStylistLooks(id);
    setLooks(stylistLooks);
    
    setLoading(false);
  };

  /**
   * Функция для открытия ссылки на социальную сеть
   * @param platform - Платформа социальной сети
   * @param username - Имя пользователя или номер телефона
   */
  const openSocialLink = async (platform: string, username: string) => {
    let url = '';
    
    // Формируем правильный URL в зависимости от платформы
    switch (platform) {
      case 'instagram':
        // Убираем @ если есть
        const instaUsername = username.startsWith('@') ? username.slice(1) : username;
        url = `https://instagram.com/${instaUsername}`;
        break;
      case 'vk':
        url = `https://vk.com/${username}`;
        break;
      case 'telegram':
        // Убираем @ если есть
        const tgUsername = username.startsWith('@') ? username.slice(1) : username;
        url = `https://t.me/${tgUsername}`;
        break;
      case 'whatsapp':
        // Для WhatsApp ожидаем номер телефона
        url = `https://wa.me/${username}`;
        break;
    }

    try {
      // Проверяем, можно ли открыть ссылку
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        showAlert('Ошибка', 'Не удалось открыть ссылку');
      }
    } catch (error) {
      showAlert('Ошибка', 'Произошла ошибка при открытии ссылки');
      console.error('Error opening URL:', error);
    }
  };

  /**
   * Обработчик клика на образ - открывает модальное окно бронирования с привязкой к образу
   */
  const handleLookPress = (look: StylistLook) => {
    setSelectedLook(look);
    setShowBookingModal(true);
  };

  /**
   * Обработчик закрытия модального окна - сбрасывает выбранный образ
   */
  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    setSelectedLook(null);
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
            <TouchableOpacity 
              style={styles.socialLink}
              onPress={() => openSocialLink('instagram', stylist.social_links.instagram!)}
            >
              <Text style={styles.socialText}>Instagram: @{stylist.social_links.instagram}</Text>
            </TouchableOpacity>
          )}
          {stylist.social_links.vk && (
            <TouchableOpacity 
              style={styles.socialLink}
              onPress={() => openSocialLink('vk', stylist.social_links.vk!)}
            >
              <Text style={styles.socialText}>VK: {stylist.social_links.vk}</Text>
            </TouchableOpacity>
          )}
          {stylist.social_links.telegram && (
            <TouchableOpacity 
              style={styles.socialLink}
              onPress={() => openSocialLink('telegram', stylist.social_links.telegram!)}
            >
              <Text style={styles.socialText}>Telegram: {stylist.social_links.telegram}</Text>
            </TouchableOpacity>
          )}
          {stylist.social_links.whatsapp && (
            <TouchableOpacity 
              style={styles.socialLink}
              onPress={() => openSocialLink('whatsapp', stylist.social_links.whatsapp!)}
            >
              <Text style={styles.socialText}>WhatsApp: {stylist.social_links.whatsapp}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Образы стилиста */}
      {looks && looks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Образы</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {looks.map((look) => (
              <TouchableOpacity
                key={look.id}
                style={styles.lookCard}
                activeOpacity={0.8}
                onPress={() => handleLookPress(look)}
              >
                <Image
                  source={{ uri: look.image_url }}
                  style={styles.lookImage}
                />
                <View style={styles.bookingBadge}>
                  <Text style={styles.bookingBadgeText}>📅 Записаться</Text>
                </View>
                <View style={styles.lookInfo}>
                  <Text style={styles.lookTitle} numberOfLines={1}>
                    {look.title}
                  </Text>
                  {look.price && (
                    <Text style={styles.lookPrice}>{look.price.toLocaleString()} ₽</Text>
                  )}
                  {look.brands && look.brands.length > 0 && (
                    <View style={styles.lookBrands}>
                      {look.brands.slice(0, 2).map((brand, idx) => (
                        <Text key={idx} style={styles.lookBrandTag} numberOfLines={1}>
                          {brand}
                        </Text>
                      ))}
                      {look.brands.length > 2 && (
                        <Text style={styles.lookBrandTag}>+{look.brands.length - 2}</Text>
                      )}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
        selectedLookId={selectedLook?.id}
        selectedLookTitle={selectedLook?.title}
        onClose={handleCloseBookingModal}
        onSuccess={() => {
          handleCloseBookingModal();
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
  socialText: {
    fontSize: 15,
    color: '#6200ee',
    flex: 1,
  },
  lookCard: {
    width: 200,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lookImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  lookInfo: {
    padding: 12,
  },
  lookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  lookPrice: {
    fontSize: 14,
    color: '#6200ee',
    fontWeight: '500',
    marginBottom: 8,
  },
  lookBrands: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  lookBrandTag: {
    fontSize: 11,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  bookingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(98, 0, 238, 0.9)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  bookingBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

