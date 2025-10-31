/**
 * Точка входа в приложение Looking
 * Инициализирует авторизацию, Яндекс.Карты и запускает навигацию
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuthStore } from './src/store/authStore';
import AppNavigator from './src/navigation/AppNavigator';

// Безопасный импорт и инициализация Яндекс.Карт
// Модуль может быть недоступен в Expo Go
try {
  const YaMap = require('react-native-yamap').default;
  const { YANDEX_MAPS_API_KEY } = require('@env');
  
  if (YaMap && YaMap.init && YANDEX_MAPS_API_KEY) {
    YaMap.init(YANDEX_MAPS_API_KEY);
    console.log('✅ Яндекс.Карты инициализированы');
  }
} catch (error) {
  console.log('ℹ️ Яндекс.Карты не доступны (требуется development build)');
}

export default function App() {
  const { loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
