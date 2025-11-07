/**
 * Компонент для запроса разрешения на Push-уведомления
 * Показывается только в веб-версии и только если разрешение не дано
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export function PushNotificationPrompt() {
  const { user } = useAuthStore();
  const { isSupported, permission, subscription, loading, subscribe } = usePushNotifications(user?.id);
  const [dismissed, setDismissed] = useState(false);

  // Проверяем, был ли промпт закрыт ранее
  useEffect(() => {
    if (Platform.OS === 'web') {
      const wasDismissed = localStorage.getItem('push-notification-prompt-dismissed');
      if (wasDismissed === 'true') {
        setDismissed(true);
      }
    }
  }, []);

  // Проверяем, является ли браузер Safari и запущено ли как PWA
  const isSafari = () => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent;
    return /^((?!chrome|android).)*safari/i.test(ua);
  };

  const isStandalone = () => {
    if (typeof window === 'undefined') return false;
    return (
      (window.matchMedia('(display-mode: standalone)').matches) ||
      ((window.navigator as any).standalone) ||
      document.referrer.includes('android-app://')
    );
  };

  // Не показываем промпт если:
  // - Не веб-платформа
  // - Push не поддерживается
  // - Разрешение уже дано или отклонено
  // - Уже есть подписка
  // - Промпт был закрыт
  // - Нет пользователя
  // - Safari, но PWA не установлено
  if (Platform.OS !== 'web' || 
      !isSupported || 
      permission === 'granted' || 
      permission === 'denied' || 
      subscription || 
      dismissed ||
      !user ||
      (isSafari() && !isStandalone())) {
    return null;
  }

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (Platform.OS === 'web') {
      localStorage.setItem('push-notification-prompt-dismissed', 'true');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔔</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Включить уведомления?</Text>
          <Text style={styles.description}>
            Получайте уведомления о новых бронированиях и сообщениях
          </Text>
        </View>
        <View style={styles.buttons}>
          <TouchableOpacity 
            style={styles.dismissButton} 
            onPress={handleDismiss}
            disabled={loading}
          >
            <Text style={styles.dismissButtonText}>Позже</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.enableButton} 
            onPress={handleEnable}
            disabled={loading}
          >
            <Text style={styles.enableButtonText}>
              {loading ? 'Включение...' : 'Включить'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
    maxWidth: 400,
    alignSelf: 'center',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 40,
  },
  textContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  dismissButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  enableButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#6200ee',
    alignItems: 'center',
  },
  enableButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

