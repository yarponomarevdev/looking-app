/**
 * Модальное окно для просмотра деталей образа
 * Показывает полную информацию об образе и позволяет записаться к стилисту
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StylistLook } from '../../types';

const { width, height } = Dimensions.get('window');

interface LookDetailModalProps {
  visible: boolean;
  look: StylistLook | null;
  isFavorited: boolean;
  onClose: () => void;
  onToggleFavorite: () => void;
  onBookLook: () => void;
  onStylistPress: () => void;
  onShare: () => void;
}

export default function LookDetailModal({
  visible,
  look,
  isFavorited,
  onClose,
  onToggleFavorite,
  onBookLook,
  onStylistPress,
  onShare,
}: LookDetailModalProps) {
  if (!look) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Кнопка закрытия */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text>
            <Ionicons name="close" size={30} color="#fff" />
          </Text>
        </TouchableOpacity>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Изображение образа */}
          <Image
            source={{ uri: look.image_url }}
            style={styles.image}
            resizeMode="contain"
          />

          {/* Кнопки действий поверх изображения */}
          <View style={styles.imageActions}>
            <TouchableOpacity
              onPress={onShare}
              style={styles.imageActionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text>
                <Ionicons name="share-outline" size={28} color="#fff" />
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onToggleFavorite}
              style={styles.imageActionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text>
                <Ionicons
                  name={isFavorited ? 'heart' : 'heart-outline'}
                  size={30}
                  color={isFavorited ? '#ff4757' : '#fff'}
                />
              </Text>
            </TouchableOpacity>
          </View>

          {/* Контент */}
          <View style={styles.content}>
            {/* Заголовок */}
            <Text style={styles.title}>{look.title}</Text>

            {/* Описание */}
            {look.description && (
              <Text style={styles.description}>{look.description}</Text>
            )}

            {/* Бренды */}
            {look.brands && look.brands.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Бренды</Text>
                <View style={styles.brandsContainer}>
                  {look.brands.map((brand, index) => (
                    <View key={index} style={styles.brandTag}>
                      <Text style={styles.brandText}>{brand}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Цена */}
            {look.price !== null && look.price !== undefined && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Стоимость</Text>
                <Text style={styles.price}>
                  {new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(look.price)}
                </Text>
              </View>
            )}

            {/* Информация о стилисте */}
            {look.stylist && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Стилист</Text>
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
                        <Ionicons name="person" size={24} color="#999" />
                      </Text>
                    </View>
                  )}
                  <View style={styles.stylistDetails}>
                    <Text style={styles.stylistName}>
                      {look.stylist.full_name}
                    </Text>
                    {look.stylist.malls && look.stylist.malls.length > 0 && (
                      <Text style={styles.stylistMall} numberOfLines={1}>
                        📍 {look.stylist.malls.join(', ')}
                      </Text>
                    )}
                  </View>
                  <Text>
                    <Ionicons name="chevron-forward" size={24} color="#999" />
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Кнопка заказа образа */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={onBookLook}
            activeOpacity={0.8}
          >
            <Text>
              <Ionicons name="calendar" size={22} color="#fff" />
            </Text>
            <Text style={styles.bookButtonText}>Заказать образ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  closeButton: {
    position: 'absolute',
    top: height > 700 ? 50 : 20,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Место для кнопки
  },
  image: {
    width: width,
    height: Math.min(height * 0.5, 600), // Максимум 50% высоты или 600px
    backgroundColor: '#f0f0f0',
  },
  imageActions: {
    position: 'absolute',
    top: height > 700 ? 50 : 20,
    left: 16,
    flexDirection: 'row',
  },
  imageActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  content: {
    padding: width < 400 ? 16 : 20,
  },
  title: {
    fontSize: width < 400 ? 22 : 26,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  brandsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginVertical: -4,
  },
  brandTag: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    margin: 4,
  },
  brandText: {
    fontSize: 14,
    color: '#6200ee',
    fontWeight: '600',
  },
  price: {
    fontSize: 24,
    color: '#6200ee',
    fontWeight: '700',
  },
  stylistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stylistDetails: {
    flex: 1,
  },
  stylistName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  stylistMall: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: width < 400 ? 16 : 20,
    paddingBottom: height < 700 ? 16 : 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bookButton: {
    backgroundColor: '#6200ee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: width < 400 ? 14 : 16,
    borderRadius: 12,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: width < 400 ? 16 : 18,
    fontWeight: '600',
    marginLeft: 10,
  },
});

