/**
 * Компонент InstallPrompt
 * Отображает уведомление о возможности установки PWA на мобильных устройствах
 * 
 * Поддерживает:
 * - Android Chrome/Edge: нативный промпт через beforeinstallprompt
 * - iOS Safari: нативно-стилизованные инструкции с визуальными подсказками
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [bounceAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Только для веб-платформы
    if (Platform.OS !== 'web') return;

    // Проверка iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Проверка, что приложение уже установлено
    const isInStandaloneMode = 
      ('standalone' in window.navigator && (window.navigator as any).standalone) ||
      window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(isInStandaloneMode);

    // Если уже установлено, не показываем промпт
    if (isInStandaloneMode) return;

    // Проверяем, был ли промпт уже показан ранее
    const wasPromptDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasPromptDismissed) return;

    // Для Android: слушаем событие beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Показываем промпт через 2 секунды после загрузки
      setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Для iOS: показываем через 2 секунды с анимацией стрелки
    if (isIOSDevice) {
      setTimeout(() => {
        setShowPrompt(true);
        startBounceAnimation();
      }, 2000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Обработка установки для Android
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    setShowPrompt(false);
  };

  // Анимация стрелки (для iOS)
  const startBounceAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Закрытие промпта
  const handleDismiss = () => {
    setShowPrompt(false);
    // Запоминаем, что пользователь закрыл промпт (на 30 дней)
    const dismissalTime = new Date().getTime() + (30 * 24 * 60 * 60 * 1000);
    localStorage.setItem('pwa-install-dismissed', dismissalTime.toString());
  };

  // Не показываем, если приложение уже установлено или промпт скрыт
  if (!showPrompt || isStandalone) return null;

  return (
    <>
      <Modal
        transparent
        visible={showPrompt}
        animationType="fade"
        onRequestClose={handleDismiss}
      >
        <View style={styles.modalOverlay}>
          {isIOS ? (
            // iOS стиль с визуальными подсказками
            <View style={styles.iosContainer}>
              <View style={styles.iosPromptCard}>
                <View style={styles.iosHeader}>
                  <Text style={styles.iosTitle}>Установить Looking</Text>
                  <TouchableOpacity onPress={handleDismiss} style={styles.iosCloseButton}>
                    <Text style={styles.iosCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.iosDescription}>
                  Для удобного доступа установите приложение на главный экран
                </Text>

                <View style={styles.iosSteps}>
                  <View style={styles.iosStep}>
                    <View style={styles.iosStepNumber}>
                      <Text style={styles.iosStepNumberText}>1</Text>
                    </View>
                    <Text style={styles.iosStepText}>
                      Нажмите кнопку <Text style={styles.shareIconText}>Поделиться</Text> внизу экрана
                    </Text>
                  </View>

                  <View style={styles.iosStep}>
                    <View style={styles.iosStepNumber}>
                      <Text style={styles.iosStepNumberText}>2</Text>
                    </View>
                    <Text style={styles.iosStepText}>
                      Выберите <Text style={styles.iosBold}>"На экран Домой"</Text>
                    </Text>
                  </View>

                  <View style={styles.iosStep}>
                    <View style={styles.iosStepNumber}>
                      <Text style={styles.iosStepNumberText}>3</Text>
                    </View>
                    <Text style={styles.iosStepText}>
                      Нажмите <Text style={styles.iosBold}>"Добавить"</Text>
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.iosButton}
                  onPress={handleDismiss}
                >
                  <Text style={styles.iosButtonText}>Понятно</Text>
                </TouchableOpacity>
              </View>

              {/* Анимированная стрелка указывающая вниз на кнопку Share */}
              <Animated.View 
                style={[
                  styles.arrowContainer,
                  { transform: [{ translateY: bounceAnim }] }
                ]}
              >
                <Text style={styles.arrowText}>↓</Text>
                <View style={styles.shareIconBox}>
                  <Text style={styles.shareIconLarge}>□↑</Text>
                </View>
              </Animated.View>
            </View>
          ) : (
            // Android стиль
            <View style={styles.promptContainer}>
              <Text style={styles.title}>Установить приложение</Text>
              <Text style={styles.description}>
                Добавьте Looking на главный экран для быстрого доступа
              </Text>

              <View style={styles.buttonContainer}>
                {deferredPrompt && (
                  <TouchableOpacity
                    style={[styles.button, styles.installButton]}
                    onPress={handleInstallClick}
                  >
                    <Text style={styles.installButtonText}>Установить</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[styles.button, styles.dismissButton]}
                  onPress={handleDismiss}
                >
                  <Text style={styles.dismissButtonText}>Позже</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  
  // iOS специфичные стили
  iosContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iosPromptCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iosTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.5,
  },
  iosCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosCloseText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  iosDescription: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
    lineHeight: 21,
  },
  iosSteps: {
    marginBottom: 20,
  },
  iosStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iosStepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#6200ee',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  iosStepNumberText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  iosStepText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  shareIconText: {
    fontWeight: '700',
    color: '#6200ee',
    fontSize: 16,
  },
  iosBold: {
    fontWeight: '700',
    color: '#000',
  },
  iosButton: {
    backgroundColor: '#6200ee',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  iosButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  
  // Анимированная стрелка для iOS
  arrowContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 40,
    color: '#6200ee',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  shareIconBox: {
    marginTop: 8,
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#6200ee',
  },
  shareIconLarge: {
    fontSize: 32,
    color: '#6200ee',
    fontWeight: 'bold',
  },

  // Android стили
  promptContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#4a4a4a',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  installButton: {
    backgroundColor: '#6200ee',
  },
  installButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    backgroundColor: '#f0f0f0',
  },
  dismissButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});

