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
import { AlertProvider } from './src/components/alert/AlertProvider';
import { UniversalInstallButton } from './src/components/pwa/UniversalInstallButton';
import { PushNotificationPrompt } from './src/components/notifications/PushNotificationPrompt';

export default function App() {
  const { loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();

    // Обработка deep links и hash parameters для email confirmation
    const handleAuthCallback = async (url: string) => {
      try {
        // Проверяем hash параметры (для веб)
        const hashMatch = url.match(/#access_token=([^&]+)/);
        const hashRefreshMatch = url.match(/&refresh_token=([^&]+)/);
        
        // Проверяем query параметры (для мобильного)
        const urlObj = new URL(url);
        const queryAccessToken = urlObj.searchParams.get('access_token');
        const queryRefreshToken = urlObj.searchParams.get('refresh_token');
        
        const accessToken = hashMatch?.[1] || queryAccessToken;
        const refreshToken = hashRefreshMatch?.[1] || queryRefreshToken;
        
        if (accessToken && refreshToken) {
          // Устанавливаем сессию через Supabase
          const { data } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          // Очищаем URL от токенов (для веб)
          if (Platform.OS === 'web' && window.history) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          
          // Сессия уже будет обработана через onAuthStateChange в initialize()
          console.log('Email confirmation successful, session:', data.session?.user?.email);
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
      }
    };

    // Обработка deep links для шеринга образов
    const handleSharingDeepLink = (url: string) => {
      try {
        const urlObj = new URL(url);
        const stylistId = urlObj.searchParams.get('stylist');
        const lookId = urlObj.searchParams.get('look');
        
        if (stylistId && lookId) {
          // Сохраняем параметры для навигации после загрузки приложения
          // Навигация будет обработана в AppNavigator через linking config
          return { stylistId, lookId };
        }
      } catch (error) {
        console.error('Error handling sharing deep link:', error);
      }
      return null;
    };

    // Для веб-версии проверяем URL в браузере
    if (Platform.OS === 'web') {
      const url = window.location.href;
      if (url.includes('access_token')) {
        handleAuthCallback(url);
      }
      
      // Обрабатываем deep links для шеринга (stylist + look параметры)
      const sharingParams = handleSharingDeepLink(url);
      if (sharingParams) {
        console.log('Sharing deep link detected:', sharingParams);
      }
    } else {
      // Для мобильных платформ используем Linking API
      // Обработка начального URL (когда приложение открывается по ссылке)
      Linking.getInitialURL().then((url) => {
        if (url && url.includes('access_token')) {
          handleAuthCallback(url);
        }
      });

      // Слушатель для deep links (когда приложение уже открыто)
      const subscription = Linking.addEventListener('url', (event) => {
        if (event.url && event.url.includes('access_token')) {
          handleAuthCallback(event.url);
        }
      });

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
    <AlertProvider>
      <AppNavigator />
      <UniversalInstallButton />
      <PushNotificationPrompt />
      <StatusBar style="auto" />
    </AlertProvider>
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
