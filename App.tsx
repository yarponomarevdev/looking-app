/**
 * Точка входа в приложение Looking
 * Инициализирует авторизацию и запускает навигацию
 * Обрабатывает deep links для email confirmation
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet, Linking, Platform } from 'react-native';
import { useAuthStore } from './src/store/authStore';
import AppNavigator from './src/navigation/AppNavigator';
import { supabase } from './src/lib/supabase';

export default function App() {
  const { loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();

    // Обработка deep links для email confirmation
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      
      // Проверяем, является ли это auth callback
      if (url && url.includes('auth/callback')) {
        // Извлекаем параметры из URL
        const urlObj = new URL(url);
        const accessToken = urlObj.searchParams.get('access_token');
        const refreshToken = urlObj.searchParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          // Устанавливаем сессию через Supabase
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
      }
    };

    // Для веб-версии проверяем URL в браузере
    if (Platform.OS === 'web') {
      const url = window.location.href;
      if (url.includes('auth/callback')) {
        handleDeepLink({ url });
      }
    } else {
      // Для мобильных платформ используем Linking API
      // Обработка начального URL (когда приложение открывается по ссылке)
      Linking.getInitialURL().then((url) => {
        if (url) {
          handleDeepLink({ url });
        }
      });

      // Слушатель для deep links (когда приложение уже открыто)
      const subscription = Linking.addEventListener('url', handleDeepLink);

      return () => {
        subscription.remove();
      };
    }
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
