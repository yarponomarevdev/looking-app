/**
 * Экран со списком уведомлений
 * Отображает все уведомления пользователя с возможностью отметить прочитанными
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import { Notification } from '../types';
import { NotificationSettings } from '../components/notifications/NotificationSettings';

export default function NotificationsScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead, subscribeToNotifications } = useNotificationStore();

  useEffect(() => {
    if (user) {
      fetchNotifications(user.id);
      const unsubscribe = subscribeToNotifications(user.id);
      return unsubscribe;
    }
  }, [user]);

  const handleNotificationPress = async (notification: Notification) => {
    // Отмечаем как прочитанное
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Если есть связанное бронирование, переходим к деталям
    if (notification.related_booking_id) {
      // Проверяем роль пользователя и открываем соответствующий экран
      const isStylist = user?.user_metadata?.role === 'stylist';
      
      if (isStylist) {
        navigation.navigate('StylistBookings');
      } else {
        navigation.navigate('Bookings');
      }
    }
  };

  const handleMarkAllRead = async () => {
    if (user) {
      await markAllAsRead(user.id);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_created':
        return '📅';
      case 'booking_confirmed':
        return '✅';
      case 'booking_rejected':
        return '❌';
      case 'booking_cancelled':
        return '🚫';
      default:
        return '📢';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;

    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.is_read && styles.unreadCard,
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{getNotificationIcon(item.type)}</Text>
        {!item.is_read && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !item.is_read && styles.unreadText]}>
          {item.title}
        </Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>{formatDate(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && notifications.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
        </View>
      </SafeAreaView>
    );
  }

  if (notifications.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
        {/* Настройки push-уведомлений (только для веб) - зафиксированы вверху */}
        {Platform.OS === 'web' && (
          <View style={styles.settingsContainer}>
            <NotificationSettings />
          </View>
        )}
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyText}>У вас пока нет уведомлений</Text>
        </View>
      </SafeAreaView>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      {/* Настройки push-уведомлений (только для веб) - зафиксированы вверху */}
      {Platform.OS === 'web' && (
        <View style={styles.settingsContainer}>
          <NotificationSettings />
        </View>
      )}
      
      {unreadCount > 0 && (
        <View style={styles.header}>
          <Text style={styles.headerText}>
            Непрочитанных: {unreadCount}
          </Text>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllButton}>Прочитать все</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        style={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  settingsContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#f5f5f5',
    zIndex: 10,
  },
  list: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  markAllButton: {
    fontSize: 14,
    color: '#6200ee',
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 8,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    elevation: 1,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  },
  unreadCard: {
    backgroundColor: '#f0e6ff',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  icon: {
    fontSize: 24,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F44336',
    borderWidth: 2,
    borderColor: 'white',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  unreadText: {
    fontWeight: 'bold',
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

