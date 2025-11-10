/**
 * Компонент настроек уведомлений
 * Позволяет пользователю управлять подпиской на push-уведомления
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Switch } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export function NotificationSettings() {
  const { user } = useAuthStore();
  const { 
    isSupported, 
    permission, 
    subscription, 
    loading, 
    subscribe, 
    unsubscribe 
  } = usePushNotifications(user?.id);

  // Проверяем Safari и standalone режим
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

  // Не показываем на мобильных платформах
  if (Platform.OS !== 'web' || !isSupported) {
    return null;
  }

  // Для Safari показываем предупреждение, если PWA не установлено
  if (isSafari() && !isStandalone()) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Push-уведомления</Text>
            <Text style={[styles.status, { color: '#ff9800' }]}>
              Для Safari требуется установка PWA
            </Text>
          </View>
        </View>
        <View style={styles.helpBox}>
          <Text style={styles.helpText}>
            Для получения push-уведомлений в Safari:
          </Text>
          <Text style={styles.bulletPoint}>1. Нажмите кнопку "Поделиться" внизу</Text>
          <Text style={styles.bulletPoint}>2. Выберите "На экран Домой"</Text>
          <Text style={styles.bulletPoint}>3. Откройте приложение с домашнего экрана</Text>
        </View>
      </View>
    );
  }

  const isEnabled = !!subscription;

  const handleToggle = async () => {
    if (isEnabled) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const getStatusText = () => {
    if (permission === 'denied') {
      return 'Уведомления заблокированы в браузере';
    }
    if (isEnabled) {
      return 'Push-уведомления включены';
    }
    return 'Push-уведомления выключены';
  };

  const getStatusColor = () => {
    if (permission === 'denied') return '#f44336';
    if (isEnabled) return '#4caf50';
    return '#666';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Push-уведомления</Text>
          <Text style={[styles.status, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
        {permission !== 'denied' && (
          <Switch
            value={isEnabled}
            onValueChange={handleToggle}
            disabled={loading}
            trackColor={{ false: '#e0e0e0', true: '#6200ee' }}
            thumbColor={isEnabled ? '#fff' : '#f4f3f4'}
          />
        )}
      </View>

      {permission === 'denied' && (
        <View style={styles.helpBox}>
          <Text style={styles.helpText}>
            Чтобы включить уведомления, разрешите их в настройках браузера
          </Text>
        </View>
      )}

      {!isEnabled && permission !== 'denied' && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Получайте мгновенные уведомления о:
          </Text>
          <Text style={styles.bulletPoint}>• Новых бронированиях</Text>
          <Text style={styles.bulletPoint}>• Подтверждении встреч</Text>
          <Text style={styles.bulletPoint}>• Сообщениях от стилистов</Text>
        </View>
      )}

      {isEnabled && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>
            ✓ Вы будете получать уведомления даже когда приложение закрыто
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
  },
  helpBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  helpText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  infoBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1565c0',
    fontWeight: '600',
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#1976d2',
    marginLeft: 8,
    marginVertical: 2,
  },
  successBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
  },
  successText: {
    fontSize: 14,
    color: '#2e7d32',
    lineHeight: 20,
  },
});

