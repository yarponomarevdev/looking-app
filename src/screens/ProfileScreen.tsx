/**
 * Экран профиля пользователя
 * Показывает информацию о пользователе, ссылки на бронирования, уведомления и кнопку выхода
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useStylistStore } from '../store/stylistStore';
import { useLookStore } from '../store/lookStore';
import NotificationBadge from '../components/notifications/NotificationBadge';
import { supabase } from '../lib/supabase';
import { StylistLook } from '../types';
import { useAlert } from '../components/alert/AlertProvider';

export default function ProfileScreen({ navigation }: any) {
  const { user, signOut } = useAuthStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const { fetchStylistByUserId } = useStylistStore();
  const { 
    fetchStylistLooks, 
    createLook, 
    deleteLook, 
    fetchLooks, 
    removeFromFavorites 
  } = useLookStore();
  const { showAlert } = useAlert();
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.user_metadata?.avatar_url || null);
  
  // Образы стилиста
  const [stylistLooks, setStylistLooks] = useState<StylistLook[]>([]);
  const [stylistId, setStylistId] = useState<string | null>(null);
  const [stylistProfileBrands, setStylistProfileBrands] = useState<string[]>([]); // Бренды из профиля стилиста
  const [loadingLooks, setLoadingLooks] = useState(false);
  
  // Избранные образы клиента
  const [favoriteLooks, setFavoriteLooks] = useState<StylistLook[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  const isStylist = user?.user_metadata?.role === 'stylist';

  // Если пользователь не авторизован, показываем экран входа
  if (!user) {
    return (
      <View style={styles.guestContainer}>
        <View style={styles.guestContent}>
          <View style={styles.guestIconContainer}>
            <Text style={styles.guestIcon}>👤</Text>
          </View>
          <Text style={styles.guestTitle}>Добро пожаловать!</Text>
          <Text style={styles.guestDescription}>
            Войдите или зарегистрируйтесь, чтобы получить доступ к полному функционалу приложения
          </Text>
          
          <View style={styles.guestFeatures}>
            <View style={styles.guestFeature}>
              <Text style={styles.guestFeatureIcon}>❤️</Text>
              <Text style={styles.guestFeatureText}>Сохраняйте избранные образы</Text>
            </View>
            <View style={styles.guestFeature}>
              <Text style={styles.guestFeatureIcon}>📅</Text>
              <Text style={styles.guestFeatureText}>Записывайтесь к стилистам</Text>
            </View>
            <View style={styles.guestFeature}>
              <Text style={styles.guestFeatureIcon}>🔔</Text>
              <Text style={styles.guestFeatureText}>Получайте уведомления о записях</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => navigation.navigate('Auth')}
            activeOpacity={0.8}
          >
            <Text style={styles.signInButtonText}>Войти или Зарегистрироваться</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /**
   * Загрузка образов стилиста
   */
  const loadStylistLooks = useCallback(async () => {
    if (!user) return;
    
    setLoadingLooks(true);
    const stylist = await fetchStylistByUserId(user.id);
    
    if (stylist) {
      setStylistId(stylist.id);
      // Сохраняем бренды из профиля стилиста для автозаполнения при создании образа
      setStylistProfileBrands(stylist.brands || []);
      const looks = await fetchStylistLooks(stylist.id);
      setStylistLooks(looks);
    }
    
    setLoadingLooks(false);
  }, [user, fetchStylistByUserId, fetchStylistLooks]);

  /**
   * Загрузка избранных образов клиента
   */
  const loadFavoriteLooks = useCallback(async () => {
    if (!user) return;
    
    setLoadingFavorites(true);
    
    try {
      // Получаем ID избранных образов
      const { data: favorites, error: favError } = await supabase
        .from('favorite_looks')
        .select('look_id')
        .eq('user_id', user.id);
      
      if (favError) throw favError;
      
      if (!favorites || favorites.length === 0) {
        setFavoriteLooks([]);
        setLoadingFavorites(false);
        return;
      }
      
      const lookIds = favorites.map(f => f.look_id);
      
      // Загружаем полную информацию об образах
      const { data: looks, error: looksError } = await supabase
        .from('stylist_looks')
        .select(`
          id, title, description, image_url, brands, price, created_at, updated_at,
          stylist_id,
          stylists:stylist_id (
            id, user_id, bio, status, latitude, longitude, malls, brands, social_links, work_schedule, portfolio_images,
            profiles:user_id (full_name, avatar_url)
          )
        `)
        .in('id', lookIds)
        .order('created_at', { ascending: false });
      
      if (looksError) throw looksError;
      
      // Преобразуем данные
      const formattedLooks: StylistLook[] = (looks || []).map((item: any) => {
        const stylistData = item.stylists;
        return {
          id: item.id,
          stylist_id: item.stylist_id,
          title: item.title,
          description: item.description,
          image_url: item.image_url,
          brands: item.brands || [],
          price: item.price,
          created_at: item.created_at,
          updated_at: item.updated_at,
          stylist: stylistData ? {
            id: stylistData.id,
            user_id: stylistData.user_id,
            full_name: stylistData.profiles?.full_name || 'Без имени',
            avatar_url: stylistData.profiles?.avatar_url,
            bio: stylistData.bio,
            status: stylistData.status,
            latitude: stylistData.latitude,
            longitude: stylistData.longitude,
            malls: stylistData.malls || [],
            brands: stylistData.brands || [],
            social_links: stylistData.social_links || {},
            work_schedule: stylistData.work_schedule || {},
            portfolio_images: stylistData.portfolio_images || [],
          } : undefined,
        };
      });
      
      setFavoriteLooks(formattedLooks);
    } catch (error: any) {
      console.error('Ошибка загрузки избранного:', error);
      showAlert('Ошибка', 'Не удалось загрузить избранное');
    } finally {
      setLoadingFavorites(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications(user.id);
      setAvatarUrl(user.user_metadata?.avatar_url || null);
    }
  }, [user]);

  // Обновляем данные при фокусе на экране
  useFocusEffect(
    useCallback(() => {
      if (user) {
        if (isStylist) {
          loadStylistLooks();
        } else {
          loadFavoriteLooks();
        }
      }
    }, [user, isStylist, loadStylistLooks, loadFavoriteLooks])
  );

  /**
   * Переход к экрану создания образа
   */
  const navigateToCreateLook = () => {
    navigation.navigate('CreateLook', { 
      profileBrands: stylistProfileBrands 
    });
  };

  /**
   * Удаление образа
   */
  const handleDeleteLook = (lookId: string) => {
    showAlert(
      'Удалить образ?',
      'Это действие нельзя отменить',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteLook(lookId);
            if (success) {
              await loadStylistLooks();
              showAlert('Успешно', 'Образ удален');
            } else {
              showAlert('Ошибка', 'Не удалось удалить образ');
            }
          },
        },
      ]
    );
  };

  /**
   * Удаление из избранного
   */
  const handleRemoveFromFavorites = async (lookId: string) => {
    if (!user) return;
    
    // Подтверждение удаления
    await new Promise<void>((resolve) => {
      showAlert(
        'Удалить из избранного?',
        'Вы всегда можете добавить образ снова',
        [
          { text: 'Отмена', style: 'cancel', onPress: () => resolve() },
          {
            text: 'Удалить',
            style: 'destructive',
            onPress: async () => {
              const success = await removeFromFavorites(user.id, lookId);
              if (success) {
                await loadFavoriteLooks();
              } else {
                showAlert('Ошибка', 'Не удалось удалить из избранного');
              }
              resolve();
            },
          },
        ]
      );
    });
  };

  /**
   * Переход к стилисту с выбранным образом
   */
  const handleBookFavoriteLook = (stylistId: string, lookId: string) => {
    navigation.navigate('StylistDetail', {
      id: stylistId,
      selectedLookId: lookId,
    });
  };

  const handleSignOut = async () => {
    // Подтверждение выхода
    await new Promise<void>((resolve) => {
      showAlert(
        'Выход',
        'Вы уверены, что хотите выйти?',
        [
          { text: 'Отмена', style: 'cancel', onPress: () => resolve() },
          {
            text: 'Выйти',
            style: 'destructive',
            onPress: async () => {
              try {
                await signOut();
              } catch (error: any) {
                showAlert('Ошибка', error.message);
              }
              resolve();
            },
          },
        ]
      );
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Аватар и информация */}
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || 'П'}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.name}>
          {user?.user_metadata?.full_name || 'Пользователь'}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>

        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>Роль:</Text>
          <Text style={styles.infoValue}>
            {isStylist ? 'Стилист' : 'Клиент'}
          </Text>
        </View>

        {/* Избранное (только для клиентов) */}
        {!isStylist && (
          <View style={styles.looksSection}>
            <View style={styles.looksSectionHeader}>
              <Text style={styles.sectionTitle}>Избранное</Text>
              <Text style={styles.favoriteCount}>
                {favoriteLooks.length} {favoriteLooks.length === 1 ? 'образ' : favoriteLooks.length < 5 ? 'образа' : 'образов'}
              </Text>
            </View>

            {loadingFavorites ? (
              <View style={styles.loadingLooks}>
                <ActivityIndicator size="small" color="#6200ee" />
              </View>
            ) : favoriteLooks.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.looksScroll}
              >
                {favoriteLooks.map((look) => (
                  <View key={look.id} style={styles.lookCardHorizontal}>
                    <TouchableOpacity
                      onPress={() => look.stylist && handleBookFavoriteLook(look.stylist.id, look.id)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{ uri: look.image_url }}
                        style={styles.lookImageHorizontal}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                    <View style={styles.lookInfoHorizontal}>
                      <View style={styles.favoriteLookTextContainer}>
                        <Text style={styles.lookTitleHorizontal} numberOfLines={1}>
                          {look.title}
                        </Text>
                        {look.stylist && (
                          <Text style={styles.stylistNameSmall} numberOfLines={1}>
                            {look.stylist.full_name}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.deleteLookButtonSmall}
                        onPress={() => handleRemoveFromFavorites(look.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.deleteLookTextSmall}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyLooks}>
                <Text style={styles.emptyLooksText}>
                  У вас пока нет избранных образов
                </Text>
                <Text style={styles.emptyLooksHint}>
                  Добавляйте понравившиеся образы из ленты, нажимая на ❤️
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Мои образы (только для стилистов) */}
        {isStylist && (
          <View style={styles.looksSection}>
            <View style={styles.looksSectionHeader}>
              <Text style={styles.sectionTitle}>Мои образы</Text>
              <TouchableOpacity
                style={styles.addLookButtonSmall}
                onPress={navigateToCreateLook}
              >
                <Text style={styles.addLookButtonSmallText}>+ Добавить</Text>
              </TouchableOpacity>
            </View>

            {loadingLooks ? (
              <View style={styles.loadingLooks}>
                <ActivityIndicator size="small" color="#6200ee" />
              </View>
            ) : stylistLooks.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.looksScroll}
              >
                {stylistLooks.map((look) => (
                  <View key={look.id} style={styles.lookCardHorizontal}>
                    <Image
                      source={{ uri: look.image_url }}
                      style={styles.lookImageHorizontal}
                      resizeMode="cover"
                    />
                    <View style={styles.lookInfoHorizontal}>
                      <Text style={styles.lookTitleHorizontal} numberOfLines={1}>
                        {look.title}
                      </Text>
                      <TouchableOpacity
                        style={styles.deleteLookButtonSmall}
                        onPress={() => handleDeleteLook(look.id)}
                      >
                        <Text style={styles.deleteLookTextSmall}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyLooks}>
                <Text style={styles.emptyLooksText}>
                  У вас пока нет образов
                </Text>
                <TouchableOpacity
                  style={styles.addFirstLookButton}
                  onPress={navigateToCreateLook}
                >
                  <Text style={styles.addFirstLookButtonText}>
                    Добавить первый образ
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Меню действий */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Меню</Text>

          {/* Редактировать профиль (только для стилистов) */}
          {isStylist && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('EditStylistProfile')}
            >
              <View style={styles.menuItemContent}>
                <Text style={styles.menuText}>Редактировать профиль</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Уведомления */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Notifications')}
          >
            <View style={styles.menuItemContent}>
              <Text style={styles.menuText}>Уведомления</Text>
            </View>
            {unreadCount > 0 && <NotificationBadge count={unreadCount} />}
          </TouchableOpacity>

          {/* Бронирования */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate(isStylist ? 'StylistBookings' : 'Bookings')}
          >
            <View style={styles.menuItemContent}>
              <Text style={styles.menuText}>
                {isStylist ? 'Запросы на встречи' : 'Мои записи'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Кнопка выхода */}
        <TouchableOpacity 
          style={styles.signOutButton} 
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Text style={styles.signOutButtonText}>Выйти</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  // Стили для гостевого экрана
  guestContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestContent: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    alignItems: 'center',
  },
  guestIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e8e0f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  guestIcon: {
    fontSize: 60,
  },
  guestTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  guestDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  guestFeatures: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    gap: 16,
  },
  guestFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guestFeatureIcon: {
    fontSize: 24,
  },
  guestFeatureText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  signInButton: {
    width: '100%',
    backgroundColor: '#6200ee',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  avatarContainer: {
    marginTop: 40,
    marginBottom: 20,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 48,
    color: 'white',
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  infoSection: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuSection: {
    width: '100%',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    position: 'relative',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  signOutButton: {
    width: '100%',
    backgroundColor: '#f44336',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    cursor: 'pointer',
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    userSelect: 'none',
  },
  looksSection: {
    width: '100%',
    marginBottom: 24,
  },
  looksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addLookButtonSmall: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addLookButtonSmallText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingLooks: {
    padding: 20,
    alignItems: 'center',
  },
  looksScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  lookCardHorizontal: {
    width: 140,
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  lookImageHorizontal: {
    width: 140,
    height: 180,
    backgroundColor: '#e0e0e0',
  },
  lookInfoHorizontal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  lookTitleHorizontal: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  deleteLookButtonSmall: {
    padding: 4,
    marginLeft: 4,
    minWidth: 24,
    minHeight: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#fff5f5',
  },
  deleteLookTextSmall: {
    fontSize: 16,
    color: '#ff4757',
    fontWeight: 'bold',
  },
  emptyLooks: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
  },
  emptyLooksText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 12,
  },
  emptyLooksHint: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  addFirstLookButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  addFirstLookButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  favoriteCount: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  favoriteLookTextContainer: {
    flex: 1,
  },
  stylistNameSmall: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
});

