/**
 * Компонент Bottom Sheet для отображения информации о стилисте на карте
 * Выдвигается снизу экрана при клике на маркер
 */

import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import { Stylist } from '../../types';

interface StylistBottomSheetProps {
  stylist: Stylist | null;
  visible: boolean;
  onClose: () => void;
  onBookPress: () => void;
  onDetailsPress: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = 280;

export default function StylistBottomSheet({ 
  stylist, 
  visible,
  onClose,
  onBookPress,
  onDetailsPress
}: StylistBottomSheetProps) {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (visible && stylist) {
      // Показать
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      // Скрыть
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, stylist]);

  if (!stylist) return null;

  const statusColor = stylist.status === 'available' ? '#4CAF50' : '#FFA726';
  const statusText = stylist.status === 'available' ? 'Свободен сейчас' : 'Занят';

  return (
    <>
      {/* Затемнение фона */}
      {visible && (
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      {/* Bottom Sheet */}
      <Animated.View 
        style={[
          styles.sheet,
          {
            transform: [{ translateY }],
          }
        ]}
      >
        {/* Ручка для свайпа */}
        <View style={styles.handle} />

        <View style={styles.content}>
          {/* Заголовок с фото */}
          <View style={styles.header}>
            {stylist.avatar_url && (
              <Image 
                source={{ uri: stylist.avatar_url }} 
                style={styles.avatar} 
              />
            )}
            <View style={styles.headerInfo}>
              <Text style={styles.name}>{stylist.full_name}</Text>
              <View style={styles.statusRow}>
                <Text style={[styles.status, { color: statusColor }]}>
                  ● {statusText}
                </Text>
              </View>
              {/* Отображаем первый ТЦ или "Несколько ТЦ" */}
              {stylist.malls && stylist.malls.length > 0 && (
                <Text style={styles.mall}>
                  📍 {stylist.malls.length === 1 
                    ? stylist.malls[0] 
                    : `${stylist.malls[0]} и еще ${stylist.malls.length - 1}`}
                </Text>
              )}
              {/* Показываем несколько брендов */}
              {stylist.brands && stylist.brands.length > 0 && (
                <Text style={styles.brands} numberOfLines={1}>
                  {stylist.brands.slice(0, 3).join(', ')}
                  {stylist.brands.length > 3 && ' ...'}
                </Text>
              )}
            </View>
          </View>

          {/* Био (краткое) */}
          {stylist.bio && (
            <Text style={styles.bio} numberOfLines={2}>
              {stylist.bio}
            </Text>
          )}

          {/* Кнопки */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={onDetailsPress}
            >
              <Text style={styles.secondaryButtonText}>Подробнее</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={onBookPress}
            >
              <Text style={styles.primaryButtonText}>Записаться</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusRow: {
    marginBottom: 6,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
  },
  mall: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  brands: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#6200ee',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});

