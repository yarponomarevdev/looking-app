/**
 * PWA Update Prompt - Toast уведомление об обновлении
 * Показывается внизу экрана когда доступна новая версия PWA
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Animated } from 'react-native';
import { logger } from '../../utils/logger';

export function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [slideAnim] = useState(new Animated.Value(100));

  useEffect(() => {
    // Только для веб-платформы
    if (Platform.OS !== 'web') {
      logger.log('[PWAUpdatePrompt] Не веб-платформа, пропускаем');
      return;
    }

    logger.log('[PWAUpdatePrompt] Компонент монтирован, слушаем PWA_UPDATE_AVAILABLE');

    // Функция для показа промпта
    const showUpdatePrompt = () => {
      logger.log('[PWAUpdatePrompt] ✅ Показываем промпт обновления');
      setShowPrompt(true);
      
      // Анимация появления снизу
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    };

    const handleUpdateAvailable = () => {
      logger.log('[PWAUpdatePrompt] ✅ Получено событие PWA_UPDATE_AVAILABLE!');
      // Сохраняем в localStorage на случай если компонент размонтируется
      localStorage.setItem('pwa-update-available', 'true');
      showUpdatePrompt();
    };

    // Проверяем, есть ли уже сохраненное состояние обновления
    const savedUpdateState = localStorage.getItem('pwa-update-available');
    if (savedUpdateState === 'true') {
      logger.log('[PWAUpdatePrompt] Обнаружено сохраненное состояние обновления');
      localStorage.removeItem('pwa-update-available');
      showUpdatePrompt();
    }

    // Проверяем версию билда при монтировании
    const checkVersion = async () => {
      try {
        const response = await fetch('/build-info.json?t=' + Date.now(), { cache: 'no-store' });
        if (!response.ok) return;
        
        const buildInfo = await response.json();
        const currentBuildId = buildInfo.buildId;
        const savedBuildId = localStorage.getItem('pwa-build-id');
        
        logger.log('[PWAUpdatePrompt] Build ID на сервере:', currentBuildId);
        logger.log('[PWAUpdatePrompt] Сохраненный Build ID:', savedBuildId);
        logger.log('[PWAUpdatePrompt] Vercel Env:', buildInfo.vercelEnv);
        
        if (savedBuildId && savedBuildId !== currentBuildId) {
          logger.log('[PWAUpdatePrompt] Обнаружен новый билд при монтировании!');
          showUpdatePrompt();
        }
      } catch (error) {
        console.error('[PWAUpdatePrompt] Ошибка проверки версии:', error);
      }
    };
    
    checkVersion();
    
    // Периодически проверяем версию (каждые 30 секунд) для быстрого обнаружения новых деплоев
    const intervalId = setInterval(() => {
      logger.log('[PWAUpdatePrompt] Периодическая проверка версии...');
      checkVersion();
    }, 30 * 1000); // 30 секунд

    window.addEventListener('PWA_UPDATE_AVAILABLE', handleUpdateAvailable);

    logger.log('[PWAUpdatePrompt] Event listener добавлен для PWA_UPDATE_AVAILABLE');

    return () => {
      logger.log('[PWAUpdatePrompt] Компонент размонтирован, удаляем listener');
      clearInterval(intervalId);
      window.removeEventListener('PWA_UPDATE_AVAILABLE', handleUpdateAvailable);
    };
  }, [slideAnim]);

  const handleUpdate = async () => {
    logger.log('[PWAUpdatePrompt] Кнопка "Обновить" нажата');
    setIsUpdating(true);
    
    // Обновляем сохраненный Build ID
    try {
      const response = await fetch('/build-info.json?t=' + Date.now(), { cache: 'no-store' });
      if (response.ok) {
        const buildInfo = await response.json();
        localStorage.setItem('pwa-build-id', buildInfo.buildId);
        localStorage.setItem('pwa-build-version', buildInfo.version);
        logger.log('[PWAUpdatePrompt] Build ID обновлен:', buildInfo.buildId);
      }
    } catch (error) {
      logger.error('[PWAUpdatePrompt] Ошибка обновления Build ID:', error);
    }
    
    // Очищаем сохраненное состояние
    localStorage.removeItem('pwa-update-available');
    localStorage.removeItem('pwa-new-build-id');
    
    // Отправляем команду Service Worker на активацию обновления
    logger.log('[PWAUpdatePrompt] Отправляем SKIP_WAITING в window');
    window.postMessage({ type: 'SKIP_WAITING' }, '*');
    
    // Показываем загрузку 1500ms для плавного UX
    // Перезагрузка произойдет автоматически через controllerchange
    setTimeout(() => {
      logger.log('[PWAUpdatePrompt] Таймаут истек, перезагружаем страницу принудительно');
      // На случай если controllerchange не сработает
      if (Platform.OS === 'web') {
        window.location.reload();
      }
    }, 1500);
  };

  const handleDismiss = () => {
    logger.log('[PWAUpdatePrompt] Кнопка "Отложить" нажата');
    // Очищаем сохраненное состояние (но оно появится снова при следующей проверке)
    localStorage.removeItem('pwa-update-available');
    // Анимация скрытия
    Animated.timing(slideAnim, {
      toValue: 100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowPrompt(false);
    });
  };

  // Не показываем на не-веб платформах или если промпт скрыт
  if (Platform.OS !== 'web' || !showPrompt) {
    if (showPrompt) {
      logger.log('[PWAUpdatePrompt] showPrompt=true, но не веб-платформа');
    }
    return null;
  }

  logger.log('[PWAUpdatePrompt] Рендерим toast, isUpdating:', isUpdating);

  return (
    <Animated.View 
      style={[
        styles.toastContainer,
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.toastContent}>
        {/* Текст */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Доступна новая версия</Text>
          <Text style={styles.subtitle}>Обновите для получения новых функций</Text>
        </View>

        {/* Кнопки */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
            disabled={isUpdating}
            activeOpacity={0.7}
          >
            <Text style={styles.dismissButtonText}>Отложить</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.updateButton, isUpdating && styles.updateButtonDisabled]}
            onPress={handleUpdate}
            disabled={isUpdating}
            activeOpacity={0.8}
          >
            {isUpdating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.updateButtonText}>Обновление...</Text>
              </View>
            ) : (
              <Text style={styles.updateButtonText}>Обновить</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
    paddingBottom: Platform.select({
      web: 20,
      default: 20,
    }),
  } as any,
  toastContent: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 -2px 16px rgba(0,0,0,0.3)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 16,
    }),
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#b0b0b0',
  },
  buttonsContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  dismissButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 100,
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#b0b0b0',
  },
  updateButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#6200ee',
    minWidth: 100,
    alignItems: 'center',
  },
  updateButtonDisabled: {
    opacity: 0.7,
  },
  updateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

