/**
 * Компонент Bottom Sheet для отображения списка стилистов торгового центра
 * Показывается при клике на метку торгового центра на карте
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
  TouchableWithoutFeedback,
  FlatList,
  ScrollView
} from 'react-native';
import { Stylist } from '../../types';

interface MallStylistsBottomSheetProps {
  mallName: string | null;
  stylists: Stylist[];
  visible: boolean;
  onClose: () => void;
  onStylistPress: (stylist: Stylist) => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = 450;

export default function MallStylistsBottomSheet({ 
  mallName,
  stylists, 
  visible,
  onClose,
  onStylistPress
}: MallStylistsBottomSheetProps) {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (visible && mallName) {
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
  }, [visible, mallName]);

  if (!mallName) return null;

  const renderStylistItem = ({ item }: { item: Stylist }) => {
    const statusColor = item.status === 'active' ? '#4CAF50' : '#999';
    const statusText = item.status === 'active' ? 'Активен' : 'Не активен';

    return (
      <TouchableOpacity 
        style={styles.stylistItem}
        onPress={() => onStylistPress(item)}
      >
        <View style={styles.stylistRow}>
          {item.avatar_url ? (
            <Image 
              source={{ uri: item.avatar_url }} 
              style={styles.avatar} 
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {item.full_name?.charAt(0).toUpperCase() || 'С'}
              </Text>
            </View>
          )}
          <View style={styles.stylistInfo}>
            <Text style={styles.stylistName}>{item.full_name}</Text>
            <Text style={[styles.status, { color: statusColor }]}>
              ● {statusText}
            </Text>
            {item.brands && item.brands.length > 0 && (
              <Text style={styles.brands} numberOfLines={1}>
                {item.brands.slice(0, 2).join(', ')}
              </Text>
            )}
          </View>
          <Text style={styles.arrow}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

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
          {/* Заголовок */}
          <View style={styles.header}>
            <Text style={styles.title}>📍 {mallName}</Text>
            <Text style={styles.subtitle}>
              {stylists.length === 0 
                ? 'Нет доступных стилистов' 
                : `Стилистов: ${stylists.length}`}
            </Text>
          </View>

          {/* Список стилистов */}
          {stylists.length > 0 ? (
            <FlatList
              data={stylists}
              renderItem={renderStylistItem}
              keyExtractor={(item) => item.id}
              style={styles.list}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                В данный момент нет стилистов,{'\n'}работающих в этом ТЦ
              </Text>
            </View>
          )}
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
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    flex: 1,
  },
  stylistItem: {
    paddingVertical: 12,
  },
  stylistRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarPlaceholderText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  stylistInfo: {
    flex: 1,
  },
  stylistName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  status: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  brands: {
    fontSize: 12,
    color: '#999',
  },
  arrow: {
    fontSize: 28,
    color: '#ccc',
    marginLeft: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
});

