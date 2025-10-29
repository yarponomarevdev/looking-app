/**
 * Главный экран приложения с картой стилистов
 * Отображает Google Maps с маркерами активных стилистов
 * Поддерживает геолокацию пользователя и real-time обновления
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useStylistStore } from '../store/stylistStore';
import StylistMarker from '../components/map/StylistMarker';
import { Stylist } from '../types';

export default function MapScreen({ navigation }: any) {
  const { stylists, loading, fetchStylists, subscribeToUpdates } = useStylistStore();
  const mapRef = useRef<MapView>(null);
  
  const [region, setRegion] = useState<Region>({
    latitude: 55.7558, // Москва центр
    longitude: 37.6173,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
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
      
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
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

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {stylists.map((stylist) => (
          <StylistMarker
            key={stylist.id}
            stylist={stylist}
            onPress={handleStylistPress}
          />
        ))}
      </MapView>
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
});

