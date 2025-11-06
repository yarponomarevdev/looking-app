/**
 * Экран профиля пользователя
 * Показывает информацию о пользователе, ссылки на бронирования, уведомления и кнопку выхода
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import NotificationBadge from '../components/notifications/NotificationBadge';

export default function ProfileScreen({ navigation }: any) {
  const { user, signOut } = useAuthStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    if (user) {
      fetchNotifications(user.id);
    }
  }, [user]);

  const isStylist = user?.user_metadata?.role === 'stylist';

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
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || 'П'}
          </Text>
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
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
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
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

