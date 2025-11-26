/**
 * Компонент карточки образа стилиста для ленты
 * Отображает изображение, название, описание, стилиста и кнопки действий
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StylistLook } from '../../types';

const { width } = Dimensions.get('window');

interface LookCardProps {
  look: StylistLook;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onBookLook: () => void;
  onStylistPress: () => void;
  onShare: () => void; // Функция для шеринга образа
  onViewLook?: () => void; // Функция для просмотра образа в модальном окне
  hideFavorite?: boolean; // Скрыть кнопку избранного (для стилистов)
}

function LookCard({
  look,
  isFavorited,
  onToggleFavorite,
  onBookLook,
  onStylistPress,
  onShare,
  onViewLook,
  hideFavorite = false,
}: LookCardProps) {
  const priceText = useMemo(() => 
    typeof look.price === 'string' ? look.price.trim() : '', 
    [look.price]
  );

  return (
    <View style={styles.card}>
      {/* Изображение образа */}
      <TouchableOpacity
        activeOpacity={onViewLook ? 0.9 : 1}
        onPress={onViewLook}
        disabled={!onViewLook}
      >
        <Image
          source={{ uri: look.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      </TouchableOpacity>
      <View style={styles.content}>
        {/* Заголовок и кнопки действий */}
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {look.title}
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={onShare}
              style={styles.actionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text>
                <Ionicons
                  name="share-outline"
                  size={24}
                  color="#666"
                />
              </Text>
            </TouchableOpacity>
            {!hideFavorite && (
              <TouchableOpacity
                onPress={onToggleFavorite}
                style={styles.actionButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text>
                  <Ionicons
                    name={isFavorited ? 'heart' : 'heart-outline'}
                    size={24}
                    color={isFavorited ? '#ff4757' : '#666'}
                  />
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {/* Описание */}
        {look.description && (
          <Text style={styles.description} numberOfLines={3}>
            {look.description}
          </Text>
        )}
        {/* Бренды */}
        {look.brands && look.brands.length > 0 && (
          <View style={styles.brandsContainer}>
            {look.brands.map((brand, index) => (
              <View key={index} style={styles.brandTag}>
                <Text style={styles.brandText}>{brand}</Text>
              </View>
            ))}
          </View>
        )}
        {/* Цена */}
        {priceText.length > 0 && (
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Стоимость:</Text>
            <Text style={styles.priceValue}>{priceText}</Text>
          </View>
        )}
        {/* Информация о стилисте */}
        {look.stylist && (
          <TouchableOpacity
            style={styles.stylistInfo}
            onPress={onStylistPress}
            activeOpacity={0.7}
          >
            {look.stylist.avatar_url ? (
              <Image
                source={{ uri: look.stylist.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text>
                  <Ionicons name="person" size={20} color="#999" />
                </Text>
              </View>
            )}
            <View style={styles.stylistDetails}>
              <Text style={styles.stylistName}>
                {look.stylist.full_name}
              </Text>
              {look.stylist.malls && look.stylist.malls.length > 0 && (
                <Text style={styles.stylistMall} numberOfLines={1}>
                  {look.stylist.malls[0]}
                </Text>
              )}
            </View>
            <Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </Text>
          </TouchableOpacity>
        )}
        {/* Кнопка заказа образа */}
        <TouchableOpacity
          style={styles.bookButton}
          onPress={onBookLook}
          activeOpacity={0.8}
        >
          <Text>
            <Ionicons name="calendar" size={20} color="#fff" />
          </Text>
          <Text style={styles.bookButtonText}>Заказать образ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }),
  },
  image: {
    width: '100%',
    height: width * 0.75, // Более компактное соотношение 4:3
    maxHeight: 500, // Ограничение для больших экранов
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginRight: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  brandsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    marginHorizontal: -4,
  },
  brandTag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    margin: 4,
  },
  brandText: {
    fontSize: 12,
    color: '#6200ee',
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  priceLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  priceValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '700',
  },
  stylistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stylistDetails: {
    flex: 1,
  },
  stylistName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  stylistMall: {
    fontSize: 13,
    color: '#999',
  },
  bookButton: {
    backgroundColor: '#6200ee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

// Мемоизация компонента для предотвращения лишних ререндеров
export default React.memo(LookCard, (prevProps, nextProps) => {
  // Кастомная функция сравнения для оптимизации
  return (
    prevProps.look.id === nextProps.look.id &&
    prevProps.look.image_url === nextProps.look.image_url &&
    prevProps.look.title === nextProps.look.title &&
    prevProps.look.description === nextProps.look.description &&
    prevProps.look.price === nextProps.look.price &&
    JSON.stringify(prevProps.look.brands) === JSON.stringify(nextProps.look.brands) &&
    prevProps.isFavorited === nextProps.isFavorited &&
    prevProps.hideFavorite === nextProps.hideFavorite &&
    prevProps.look.stylist?.id === nextProps.look.stylist?.id &&
    prevProps.look.stylist?.full_name === nextProps.look.stylist?.full_name &&
    prevProps.look.stylist?.avatar_url === nextProps.look.stylist?.avatar_url
  );
});

