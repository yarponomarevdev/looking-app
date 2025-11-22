/**
 * Экран ленты образов стилистов
 * Отображает все образы в виде вертикального списка с возможностью добавления в избранное
 * и заказа консультации с выбранным образом
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { useLookStore } from '../store/lookStore';
import { useAuthStore } from '../store/authStore';
import { useAlert } from '../components/alert/AlertProvider';
import { RootStackParamList, StylistLook } from '../types';
import LookCard from '../components/feed/LookCard';
import LookDetailModal from '../components/feed/LookDetailModal';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function FeedScreen({ route }: any) {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const { showToast } = useAlert();
  const isStylist = user?.user_metadata?.role === 'stylist';
  const {
    looks,
    loading,
    fetchLooks,
    fetchFavorites,
    addToFavorites,
    removeFromFavorites,
    isFavorited,
  } = useLookStore();

  // Параметры из deep link
  const stylistId = route?.params?.stylist;
  const lookId = route?.params?.look;

  // Состояние для модального окна просмотра образа
  const [selectedLookForView, setSelectedLookForView] = useState<StylistLook | null>(null);
  const [showLookModal, setShowLookModal] = useState(false);

  // Загружаем образы и избранное при монтировании
  useEffect(() => {
    fetchLooks();
    if (user && !isStylist) {
      fetchFavorites(user.id);
    }
  }, [user, isStylist]);

  // Обрабатываем deep link с параметрами стилиста и образа
  useEffect(() => {
    if (stylistId && lookId && !loading && looks.length > 0) {
      // Находим образ по ID
      const look = looks.find(l => l.id === lookId && l.stylist?.id === stylistId);
      if (look) {
        // Небольшая задержка, чтобы экран успел отобразиться
        const timer = setTimeout(() => {
          console.log('Opening look from deep link:', { stylistId, lookId });
          setSelectedLookForView(look);
          setShowLookModal(true);
        }, 300);
        
        return () => clearTimeout(timer);
      }
    }
  }, [stylistId, lookId, loading, looks]);

  // Обновляем избранное при возврате на экран
  useFocusEffect(
    useCallback(() => {
      if (user && !isStylist) {
        fetchFavorites(user.id);
      }
    }, [user, isStylist])
  );

  // Обработка обновления списка
  const handleRefresh = async () => {
    await fetchLooks();
    if (user && !isStylist) {
      await fetchFavorites(user.id);
    }
  };

  // Переключение избранного
  const handleToggleFavorite = async (lookId: string) => {
    if (!user) {
      // Если пользователь не авторизован, предлагаем войти
      showToast({
        message: 'Войдите, чтобы добавлять образы в избранное',
        type: 'info',
        duration: 3000,
      });
      navigation.navigate('Auth');
      return;
    }

    // Стилисты не могут добавлять в избранное
    if (user.user_metadata?.role === 'stylist') {
      return;
    }

    // В isFavorited теперь нет смысла, т.к. UI обновляется мгновенно.
    // Просто вызываем метод и обрабатываем возможную ошибку отката.
    const success = isFavorited(lookId)
      ? await removeFromFavorites(user.id, lookId)
      : await addToFavorites(user.id, lookId);

    if (!success) {
      // Если optimistic update не удался, показываем ошибку
      showToast({
        message: 'Не удалось обновить избранное. Попробуйте снова.',
        type: 'error',
      });
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
  const handleShare = async (look: StylistLook) => {
    try {
      if (!look.stylist) {
        showToast({
          message: 'Не удалось получить данные стилиста',
          type: 'error',
        });
        return;
      }

      // Генерируем ссылку на образ через ленту (для публичного доступа)
      const shareUrl = `https://looking-web.vercel.app/?stylist=${look.stylist.id}&look=${look.id}`;
      
      // Копируем в буфер обмена
      await Clipboard.setStringAsync(shareUrl);
      
      // Показываем успешное уведомление через toast
      showToast({
        message: `Ссылка на образ "${look.title}" скопирована!`,
        type: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Ошибка при копировании ссылки:', error);
      showToast({
        message: 'Не удалось скопировать ссылку. Попробуйте снова.',
        type: 'error',
      });
    }
  };

  // Открытие просмотра образа
  const handleViewLook = (look: StylistLook) => {
    setSelectedLookForView(look);
    setShowLookModal(true);
  };

  // Закрытие модального окна просмотра образа
  const handleCloseLookModal = () => {
    setShowLookModal(false);
    setSelectedLookForView(null);
  };

  // Обработка бронирования из модального окна
  const handleBookFromModal = () => {
    if (!user) {
      showToast({
        message: 'Войдите, чтобы записаться к стилисту',
        type: 'info',
        duration: 3000,
      });
      handleCloseLookModal();
      navigation.navigate('Auth');
      return;
    }

    if (selectedLookForView?.stylist) {
      handleCloseLookModal();
      handleBookLook(selectedLookForView.stylist.id, selectedLookForView.id);
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
            onShare={() => handleShare(item)}
            onViewLook={() => handleViewLook(item)}
            hideFavorite={isStylist}
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

      {/* Модальное окно просмотра образа */}
      <LookDetailModal
        visible={showLookModal}
        look={selectedLookForView}
        isFavorited={selectedLookForView ? isFavorited(selectedLookForView.id) : false}
        onClose={handleCloseLookModal}
        onToggleFavorite={() => selectedLookForView && handleToggleFavorite(selectedLookForView.id)}
        onBookLook={handleBookFromModal}
        onStylistPress={() => {
          if (selectedLookForView?.stylist) {
            handleCloseLookModal();
            handleStylistPress(selectedLookForView.stylist.id);
          }
        }}
        onShare={() => selectedLookForView && handleShare(selectedLookForView)}
        hideFavorite={isStylist}
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
