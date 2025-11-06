/**
 * Компонент карточки образа стилиста для ленты
 * Отображает изображение, название, описание, стилиста и кнопки действий
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StylistLook } from '../../types';

const { width } = Dimensions.get('window');

interface LookCardProps {
  look: StylistLook;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onBookLook: () => void;
  onStylistPress: () => void;
}

export default function LookCard({
  look,
  isFavorited,
  onToggleFavorite,
  onBookLook,
  onStylistPress,
}: LookCardProps) {
  return (
    <View style={styles.card}>
      {/* Изображение образа */}
      <Image
        source={{ uri: look.image_url }}
        style={styles.image}
        resizeMode="cover"
      />
      
      {/* Информация об образе */}
      <View style={styles.content}>
        {/* Заголовок и кнопка избранного */}
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {look.title}
          </Text>
          <TouchableOpacity
            onPress={onToggleFavorite}
            style={styles.favoriteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={28}
              color={isFavorited ? '#ff4757' : '#666'}
            />
          </TouchableOpacity>
        </View>
        
        {/* Описание */}
        {look.description && (
          <Text style={styles.description} numberOfLines={3}>
            {look.description}
          </Text>
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
                <Ionicons name="person" size={20} color="#999" />
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
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        )}
        
        {/* Кнопка заказа образа */}
        <TouchableOpacity
          style={styles.bookButton}
          onPress={onBookLook}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar" size={20} color="#fff" />
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
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  image: {
    width: '100%',
    height: width * 1.2, // Соотношение примерно как в Instagram
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
  favoriteButton: {
    padding: 4,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
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
    gap: 8,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

