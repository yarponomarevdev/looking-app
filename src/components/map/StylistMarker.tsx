/**
 * Компонент маркера стилиста на Яндекс.Карте
 * Отображает кастомный маркер с аватаром и статусом стилиста
 * Поддерживает клик для перехода к детальной информации
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Stylist } from '../../types';

// Безопасный импорт Marker из Яндекс.Карт
let Marker: any = null;
try {
  const yamap = require('react-native-yamap');
  Marker = yamap.Marker;
} catch (error) {
  // Marker недоступен в Expo Go
}

interface StylistMarkerProps {
  stylist: Stylist;
  onPress: (stylist: Stylist) => void;
}

export default function StylistMarker({ stylist, onPress }: StylistMarkerProps) {
  // Цвет индикатора статуса
  const statusColor = stylist.status === 'available' ? '#4CAF50' : '#FFA726';
  
  // Если Marker недоступен, возвращаем null
  if (!Marker) {
    return null;
  }
  
  return (
    <Marker
      point={{ 
        lat: stylist.latitude, 
        lon: stylist.longitude 
      }}
      onPress={() => onPress(stylist)}
    >
      <View style={styles.markerContainer}>
        {/* Аватар стилиста */}
        <View style={[styles.avatarContainer, { borderColor: statusColor }]}>
          {stylist.avatar_url ? (
            <Image 
              source={{ uri: stylist.avatar_url }} 
              style={styles.avatar} 
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: statusColor }]}>
              <Text style={styles.avatarPlaceholderText}>
                {stylist.full_name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        
        {/* Индикатор статуса */}
        <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    backgroundColor: 'white',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
    position: 'absolute',
    bottom: -2,
    right: -2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});
