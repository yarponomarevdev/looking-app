/**
 * Экран профиля пользователя
 * Показывает информацию о пользователе, ссылки на бронирования, уведомления и кнопку выхода
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Image, ActivityIndicator, TextInput, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useStylistStore } from '../store/stylistStore';
import { useLookStore } from '../store/lookStore';
import NotificationBadge from '../components/notifications/NotificationBadge';
import { supabase } from '../lib/supabase';
import { StylistLook } from '../types';

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
  
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.user_metadata?.avatar_url || null);
  
  // Образы стилиста
  const [stylistLooks, setStylistLooks] = useState<StylistLook[]>([]);
  const [stylistId, setStylistId] = useState<string | null>(null);
  const [loadingLooks, setLoadingLooks] = useState(false);
  
  // Избранные образы клиента
  const [favoriteLooks, setFavoriteLooks] = useState<StylistLook[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  
  // Модальное окно для создания образа
  const [isLookModalVisible, setIsLookModalVisible] = useState(false);
  const [newLookTitle, setNewLookTitle] = useState('');
  const [newLookDescription, setNewLookDescription] = useState('');
  const [newLookImage, setNewLookImage] = useState<string | null>(null);

  const isStylist = user?.user_metadata?.role === 'stylist';

  /**
   * Загрузка образов стилиста
   */
  const loadStylistLooks = useCallback(async () => {
    if (!user) return;
    
    setLoadingLooks(true);
    const stylist = await fetchStylistByUserId(user.id);
    
    if (stylist) {
      setStylistId(stylist.id);
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
          id, title, description, image_url, created_at, updated_at,
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
      Alert.alert('Ошибка', 'Не удалось загрузить избранное');
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
   * Выбор изображения из галереи
   */
  const pickImage = async () => {
    // Запрашиваем разрешение на доступ к галерее
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Необходимо разрешение на доступ к галерее');
      return;
    }

    // Открываем выбор изображения
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  /**
   * Загрузка аватара в Supabase Storage
   */
  const uploadAvatar = async (uri: string) => {
    if (!user) return;

    try {
      setUploading(true);

      // Создаем FormData для загрузки файла
      const formData = new FormData();
      
      // Получаем расширение файла
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Создаем объект файла для FormData
      const file: any = {
        uri: uri,
        type: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
        name: fileName,
      };

      // Читаем файл как ArrayBuffer для Supabase
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      // Загружаем в Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Получаем публичный URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Обновляем метаданные пользователя
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      if (updateError) {
        throw updateError;
      }

      // Обновляем таблицу profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (profileError) {
        console.error('Ошибка обновления profiles:', profileError);
      }

      setAvatarUrl(publicUrl);
      Alert.alert('Успешно', 'Аватар обновлен');
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    } finally {
      setUploading(false);
    }
  };

  /**
   * Выбор изображения для нового образа
   */
  const pickLookImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Необходимо разрешение на доступ к галерее');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setNewLookImage(result.assets[0].uri);
    }
  };

  /**
   * Загрузка изображения образа в Supabase Storage
   */
  const uploadLookImage = async (uri: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `look-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('looks')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('looks')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
      return null;
    }
  };

  /**
   * Создание нового образа
   */
  const handleCreateLook = async () => {
    if (!stylistId || !newLookImage || !newLookTitle.trim()) {
      Alert.alert('Ошибка', 'Заполните название и добавьте фото');
      return;
    }

    setUploading(true);

    const imageUrl = await uploadLookImage(newLookImage);
    
    if (!imageUrl) {
      setUploading(false);
      return;
    }

    const success = await createLook(
      stylistId,
      newLookTitle.trim(),
      newLookDescription.trim(),
      imageUrl
    );

    setUploading(false);

    if (success) {
      await loadStylistLooks();
      
      setNewLookTitle('');
      setNewLookDescription('');
      setNewLookImage(null);
      setIsLookModalVisible(false);
      
      Alert.alert('Успешно', 'Образ добавлен');
    } else {
      Alert.alert('Ошибка', 'Не удалось создать образ');
    }
  };

  /**
   * Удаление образа
   */
  const handleDeleteLook = (lookId: string) => {
    Alert.alert(
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
              Alert.alert('Успешно', 'Образ удален');
            } else {
              Alert.alert('Ошибка', 'Не удалось удалить образ');
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
    
    // Кроссплатформенное подтверждение
    let confirmed = false;
    if (Platform.OS === 'web') {
      confirmed = window.confirm('Удалить из избранного?\nВы всегда можете добавить образ снова');
    } else {
      await new Promise<void>((resolve) => {
        Alert.alert(
          'Удалить из избранного?',
          'Вы всегда можете добавить образ снова',
          [
            { text: 'Отмена', style: 'cancel', onPress: () => resolve() },
            {
              text: 'Удалить',
              style: 'destructive',
              onPress: () => {
                confirmed = true;
                resolve();
              },
            },
          ]
        );
      });
    }
    
    if (confirmed) {
      const success = await removeFromFavorites(user.id, lookId);
      if (success) {
        await loadFavoriteLooks();
      } else {
        if (Platform.OS === 'web') {
          alert('Ошибка: Не удалось удалить из избранного');
        } else {
          Alert.alert('Ошибка', 'Не удалось удалить из избранного');
        }
      }
    }
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
    // Кроссплатформенное подтверждение
    let confirmed = false;
    if (Platform.OS === 'web') {
      confirmed = window.confirm('Вы уверены, что хотите выйти?');
    } else {
      await new Promise<void>((resolve) => {
        Alert.alert(
          'Выход',
          'Вы уверены, что хотите выйти?',
          [
            { text: 'Отмена', style: 'cancel', onPress: () => resolve() },
            {
              text: 'Выйти',
              style: 'destructive',
              onPress: () => {
                confirmed = true;
                resolve();
              },
            },
          ]
        );
      });
    }
    
    if (confirmed) {
      try {
        await signOut();
      } catch (error: any) {
        if (Platform.OS === 'web') {
          alert(`Ошибка: ${error.message}`);
        } else {
          Alert.alert('Ошибка', error.message);
        }
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Аватар и информация */}
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={pickImage}
          disabled={uploading}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || 'П'}
              </Text>
            </View>
          )}
          
          {uploading ? (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator color="white" size="large" />
            </View>
          ) : (
            <View style={styles.editBadge}>
              <Text style={styles.editBadgeText}>✏️</Text>
            </View>
          )}
        </TouchableOpacity>

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
                onPress={() => setIsLookModalVisible(true)}
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
                  onPress={() => setIsLookModalVisible(true)}
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

      {/* Модальное окно для добавления образа */}
      {isLookModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Новый образ</Text>
            
            {/* Превью изображения */}
            <TouchableOpacity
              style={styles.imagePicker}
              onPress={pickLookImage}
            >
              {newLookImage ? (
                <Image
                  source={{ uri: newLookImage }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Text style={styles.imagePickerText}>📷</Text>
                  <Text style={styles.imagePickerHint}>Выберите фото</Text>
                </View>
              )}
            </TouchableOpacity>
            
            {/* Название */}
            <TextInput
              style={styles.input}
              placeholder="Название образа"
              value={newLookTitle}
              onChangeText={setNewLookTitle}
              maxLength={100}
            />
            
            {/* Описание */}
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Описание (опционально)"
              value={newLookDescription}
              onChangeText={setNewLookDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            
            {/* Кнопки */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setIsLookModalVisible(false);
                  setNewLookTitle('');
                  setNewLookDescription('');
                  setNewLookImage(null);
                }}
                disabled={uploading}
              >
                <Text style={styles.modalButtonTextCancel}>Отмена</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleCreateLook}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.modalButtonTextSave}>Добавить</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6200ee',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  editBadgeText: {
    fontSize: 14,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  imagePicker: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePickerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    fontSize: 48,
    marginBottom: 8,
  },
  imagePickerHint: {
    fontSize: 14,
    color: '#666',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f5f5f5',
  },
  modalButtonSave: {
    backgroundColor: '#6200ee',
  },
  modalButtonTextCancel: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextSave: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

