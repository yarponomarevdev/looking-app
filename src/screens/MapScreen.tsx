/**
 * Главный экран приложения с картой стилистов
 * Отображает Яндекс.Карты с маркерами активных стилистов
 * Поддерживает геолокацию пользователя и real-time обновления
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Text, Platform } from 'react-native';
import * as Location from 'expo-location';
import { useStylistStore } from '../store/stylistStore';
import { Stylist } from '../types';

// Безопасный импорт Яндекс.Карт (может быть null в Expo Go)
let YaMap: any = null;
let CameraPosition: any = null;
let StylistMarker: any = null;

try {
  const yamap = require('react-native-yamap');
  YaMap = yamap.YaMap;
  CameraPosition = yamap.CameraPosition;
  StylistMarker = require('../components/map/StylistMarker').default;
} catch (error) {
  console.log('Яндекс.Карты не доступны (это нормально для Expo Go)');
}

export default function MapScreen({ navigation }: any) {
  const { stylists, loading, fetchStylists, subscribeToUpdates } = useStylistStore();
  const mapRef = useRef<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // Начальная позиция камеры (Москва, центр)
  const [cameraPosition, setCameraPosition] = useState<any>({
    zoom: 12,
    tilt: 0,
    azimuth: 0,
    center: {
      lat: 55.7558,
      lon: 37.6173,
    },
  });

  useEffect(() => {
    initializeLocation();
    fetchStylists();
    const unsubscribe = subscribeToUpdates();
    return unsubscribe;
  }, []);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Требуется доступ к геолокации',
          'Для показа стилистов рядом с вами нужен доступ к местоположению'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const newCameraPosition = {
        zoom: 14,
        tilt: 0,
        azimuth: 0,
        center: {
          lat: location.coords.latitude,
          lon: location.coords.longitude,
        },
      };
      
      setCameraPosition(newCameraPosition);
    } catch (error) {
      console.error('Ошибка получения геолокации:', error);
    }
  };

  const handleStylistPress = (stylist: Stylist) => {
    navigation.navigate('StylistDetail', { id: stylist.id });
  };

  if (loading && stylists.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  // Проверка доступности Яндекс.Карт (для Expo Go)
  if (!YaMap) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>⚠️ Яндекс.Карты недоступны</Text>
        <Text style={styles.errorText}>
          Для работы с Яндекс.Картами необходимо собрать приложение с нативными модулями.
        </Text>
        <Text style={styles.errorText}>
          Выполните команду:{'\n'}
          <Text style={styles.errorCommand}>npx expo run:android</Text>
        </Text>
        <Text style={styles.errorHint}>
          Яндекс.Карты не поддерживаются в Expo Go
        </Text>
      </View>
    );
  }

  // Если произошла ошибка при рендеринге карты
  if (mapError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>⚠️ Ошибка загрузки карты</Text>
        <Text style={styles.errorText}>
          Не удалось загрузить Яндекс.Карты.{'\n'}
          Проверьте API ключ в файле .env
        </Text>
        <Text style={styles.errorHint}>{mapError}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <YaMap
        ref={mapRef}
        style={styles.map}
        initialRegion={cameraPosition}
        showUserPosition={true}
        nightMode={false}
        mapType="vector"
        rotateGesturesEnabled={true}
        scrollGesturesEnabled={true}
        tiltGesturesEnabled={true}
        zoomGesturesEnabled={true}
        onMapLoaded={() => console.log('✅ Яндекс.Карты загружены')}
        onError={(error: any) => {
          console.error('Ошибка Яндекс.Карт:', error);
          setMapError(error?.toString() || 'Неизвестная ошибка');
        }}
      >
        {stylists.map((stylist) => (
          <StylistMarker
            key={stylist.id}
            stylist={stylist}
            onPress={handleStylistPress}
          />
        ))}
      </YaMap>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  map: { 
    flex: 1 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorCommand: {
    fontFamily: 'monospace',
    backgroundColor: '#e0e0e0',
    padding: 4,
    borderRadius: 4,
    color: '#d32f2f',
  },
  errorHint: {
    fontSize: 14,
    marginTop: 20,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
