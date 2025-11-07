/**
 * Тестовая утилита для PWA Install Prompt
 * Добавьте этот компонент временно для отладки на мобильном
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

export function TestPrompt() {
  if (Platform.OS !== 'web') return null;

  const handleClearStorage = () => {
    localStorage.removeItem('pwa-install-dismissed');
    alert('localStorage очищен! Перезагрузите страницу.');
  };

  const handleCheckConditions = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isStandalone = 
      ('standalone' in window.navigator && (window.navigator as any).standalone) ||
      window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = localStorage.getItem('pwa-install-dismissed');

    const info = `
📱 User Agent: ${userAgent}

✓ iOS: ${isIOS}
✓ Android: ${isAndroid}
✓ Standalone: ${isStandalone}
✓ Dismissed: ${dismissed ? new Date(parseInt(dismissed)).toLocaleString() : 'Нет'}

Platform.OS: ${Platform.OS}
    `;

    alert(info);
    console.log(info);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 PWA Debug</Text>
      <TouchableOpacity style={styles.button} onPress={handleCheckConditions}>
        <Text style={styles.buttonText}>Проверить условия</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleClearStorage}>
        <Text style={styles.buttonText}>Очистить localStorage</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 8,
    zIndex: 9999,
  },
  title: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  buttonText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '600',
  },
});

