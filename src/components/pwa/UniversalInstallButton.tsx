/**
 * Универсальная кнопка установки PWA
 * - Android/Chrome: нативный промпт установки
 * - iOS Safari: визуальная подсказка с минимальной анимацией
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal, Animated } from 'react-native';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function UniversalInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const arrowAnimation = useState(new Animated.Value(0))[0];

  // Проверка типа устройства
  const isIOS = () => {
    if (typeof window === 'undefined') return false;
    return /iPhone|iPad|iPod/.test(window.navigator.userAgent);
  };

  const isSafari = () => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent;
    return /^((?!chrome|android).)*safari/i.test(ua);
  };

  const isStandalone = () => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  };

  // Проверяем, было ли приложение уже установлено
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Проверяем standalone режим
      if (isStandalone()) {
        setIsInstalled(true);
        return;
      }

      // Проверяем localStorage
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (dismissed === 'true') {
        setIsDismissed(true);
      }
    }
  }, []);

  // Слушаем событие beforeinstallprompt для Android/Chrome
  useEffect(() => {
    if (Platform.OS !== 'web' || isIOS()) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Анимация стрелки для iOS
  useEffect(() => {
    if (showIOSPrompt) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(arrowAnimation, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(arrowAnimation, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [showIOSPrompt]);

  // Не показываем кнопку если уже установлено или закрыто
  if (Platform.OS !== 'web' || isInstalled || isDismissed) {
    return null;
  }

  // Android/Chrome - установка через нативный промпт
  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error installing PWA:', error);
    }
  };

  // iOS Safari - показываем визуальную подсказку
  const handleIOSInstall = () => {
    setShowIOSPrompt(true);
  };

  const handleCloseIOSPrompt = () => {
    setShowIOSPrompt(false);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (Platform.OS === 'web') {
      localStorage.setItem('pwa-install-dismissed', 'true');
    }
  };

  const arrowTranslate = arrowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  // Для iOS Safari
  if (isIOS() && isSafari() && !isStandalone()) {
    return (
      <>
        <TouchableOpacity
          style={styles.installButton}
          onPress={handleIOSInstall}
          activeOpacity={0.8}
        >
          <Text style={styles.installIcon}>📲</Text>
          <Text style={styles.installText}>Установить приложение</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* iOS промпт с визуальной подсказкой */}
        <Modal
          visible={showIOSPrompt}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCloseIOSPrompt}
        >
          <TouchableOpacity
            style={styles.iosOverlay}
            activeOpacity={1}
            onPress={handleCloseIOSPrompt}
          >
            <View style={styles.iosPromptContainer}>
              {/* Стрелка указывающая вниз */}
              <Animated.View
                style={[
                  styles.arrowContainer,
                  { transform: [{ translateY: arrowTranslate }] }
                ]}
              >
                <Text style={styles.arrowIcon}>⬇️</Text>
              </Animated.View>

              {/* Минимальная подсказка */}
              <View style={styles.iosPromptContent}>
                <Text style={styles.iosPromptTitle}>Установите приложение</Text>
                <View style={styles.iosSteps}>
                  <View style={styles.iosStep}>
                    <Text style={styles.iosStepNumber}>1</Text>
                    <Text style={styles.iosStepText}>
                      Нажмите <Text style={styles.iosStepIcon}>⎙</Text> внизу экрана
                    </Text>
                  </View>
                  <View style={styles.iosStep}>
                    <Text style={styles.iosStepNumber}>2</Text>
                    <Text style={styles.iosStepText}>
                      Выберите "На экран «Домой»"
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.iosCloseButton}
                  onPress={handleCloseIOSPrompt}
                >
                  <Text style={styles.iosCloseButtonText}>Понятно</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </>
    );
  }

  // Для Android/Chrome - только если есть промпт
  if (deferredPrompt) {
    return (
      <TouchableOpacity
        style={styles.installButton}
        onPress={handleAndroidInstall}
        activeOpacity={0.8}
      >
        <Text style={styles.installIcon}>📲</Text>
        <Text style={styles.installText}>Установить приложение</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  installButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#6200ee',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    }),
    zIndex: 999,
    maxWidth: 400,
    alignSelf: 'center',
  },
  installIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  installText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },

  // iOS Prompt Styles
  iosOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  iosPromptContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  arrowContainer: {
    marginBottom: 20,
  },
  arrowIcon: {
    fontSize: 48,
    textAlign: 'center',
  },
  iosPromptContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    maxWidth: 400,
    width: '90%',
  },
  iosPromptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  iosSteps: {
    marginBottom: 24,
  },
  iosStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iosStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6200ee',
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
    marginRight: 12,
  },
  iosStepText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 28,
  },
  iosStepIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  iosCloseButton: {
    backgroundColor: '#6200ee',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  iosCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

