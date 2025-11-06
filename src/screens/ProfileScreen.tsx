/**
 * Экран профиля пользователя
 * Показывает информацию о пользователе, ссылки на бронирования, уведомления и кнопку выхода
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import NotificationBadge from '../components/notifications/NotificationBadge';
import { supabase } from '../lib/supabase';

export default function ProfileScreen({ navigation }: any) {
  const { user, signOut } = useAuthStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.user_metadata?.avatar_url || null);

  useEffect(() => {
    if (user) {
      fetchNotifications(user.id);
      setAvatarUrl(user.user_metadata?.avatar_url || null);
    }
  }, [user]);

  const isStylist = user?.user_metadata?.role === 'stylist';

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

  const handleSignOut = async () => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error: any) {
              Alert.alert('Ошибка', error.message);
            }
          },
        },
      ]
    );
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
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
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
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

