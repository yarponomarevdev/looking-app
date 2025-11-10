/**
 * Экран ленты образов стилистов
 * Отображает все образы в виде вертикального списка с возможностью добавления в избранное
 * и заказа консультации с выбранным образом
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { useLookStore } from '../store/lookStore';
import { useAuthStore } from '../store/authStore';
import { RootStackParamList } from '../types';
import LookCard from '../components/feed/LookCard';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function FeedScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const {
    looks,
    loading,
    fetchLooks,
    fetchFavorites,
    addToFavorites,
    removeFromFavorites,
    isFavorited,
  } = useLookStore();

  // Загружаем образы и избранное при монтировании
  useEffect(() => {
    fetchLooks();
    if (user) {
      fetchFavorites(user.id);
    }
  }, [user]);

  // Обновляем избранное при возврате на экран
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchFavorites(user.id);
      }
    }, [user])
  );

  // Обработка обновления списка
  const handleRefresh = async () => {
    await fetchLooks();
    if (user) {
      await fetchFavorites(user.id);
    }
  };

  // Переключение избранного
  const handleToggleFavorite = async (lookId: string) => {
    if (!user) return;

    const favorited = isFavorited(lookId);
    if (favorited) {
      await removeFromFavorites(user.id, lookId);
    } else {
      await addToFavorites(user.id, lookId);
    }
  };

  // Переход к профилю стилиста с выбранным образом
  const handleBookLook = (stylistId: string, lookId: string) => {
    navigation.navigate('StylistDetail', {
      id: stylistId,
      selectedLookId: lookId,
    });
  };

  // Переход к профилю стилиста
  const handleStylistPress = (stylistId: string) => {
    navigation.navigate('StylistDetail', { id: stylistId });
  };

  // Шеринг образа - копирование ссылки в буфер обмена
  const handleShare = async (lookId: string, lookTitle: string) => {
    try {
      // Генерируем ссылку на образ
      // TODO: заменить на реальный домен приложения из env
      const shareUrl = `https://looking-app.vercel.app/look/${lookId}`;
      
      // Копируем в буфер обмена
      await Clipboard.setStringAsync(shareUrl);
      
      // Показываем уведомление об успешном копировании
      Alert.alert(
        'Ссылка скопирована',
        `Ссылка на образ "${lookTitle}" скопирована в буфер обмена`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Ошибка при копировании ссылки:', error);
      Alert.alert(
        'Ошибка',
        'Не удалось скопировать ссылку. Попробуйте снова.',
        [{ text: 'OK' }]
      );
    }
  };

  // Отображение пустого состояния
  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Образов пока нет</Text>
        <Text style={styles.emptyText}>
          Стилисты еще не добавили свои образы.{'\n'}
          Загляните позже!
        </Text>
      </View>
    );
  };

  // Отображение загрузки
  if (loading && looks.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Загрузка образов...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={looks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LookCard
            look={item}
            isFavorited={isFavorited(item.id)}
            onToggleFavorite={() => handleToggleFavorite(item.id)}
            onBookLook={() => item.stylist && handleBookLook(item.stylist.id, item.id)}
            onStylistPress={() => item.stylist && handleStylistPress(item.stylist.id)}
            onShare={() => handleShare(item.id, item.title)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            colors={['#6200ee']}
            tintColor="#6200ee"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});

