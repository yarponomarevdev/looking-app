/**
 * Главный экран приложения с картой стилистов
 * Отображает Яндекс.Карты через WebView с маркерами активных стилистов
 * Поддерживает геолокацию пользователя и real-time обновления
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import * as Location from 'expo-location';
import { useStylistStore } from '../store/stylistStore';
import { Stylist } from '../types';

export default function MapScreen({ navigation }: any) {
  const { stylists, loading, fetchStylists, subscribeToUpdates } = useStylistStore();
  const webViewRef = useRef<WebView>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    initializeLocation();
    fetchStylists();
    const unsubscribe = subscribeToUpdates();
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (mapLoaded && stylists.length > 0) {
      updateMarkers();
    }
  }, [stylists, mapLoaded]);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({
          lat: location.coords.latitude,
          lon: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Ошибка получения геолокации:', error);
    }
  };

  const updateMarkers = () => {
    const markersData = stylists.map((stylist) => ({
      id: stylist.id,
      lat: stylist.latitude,
      lon: stylist.longitude,
      name: stylist.full_name,
      mall: stylist.current_mall,
      status: stylist.status,
      avatar: stylist.avatar_url,
    }));

    const jsCode = `
      if (window.updateMarkers) {
        window.updateMarkers(${JSON.stringify(markersData)});
      }
      true;
    `;

    webViewRef.current?.injectJavaScript(jsCode);
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'mapLoaded') {
        setMapLoaded(true);
        console.log('✅ Яндекс.Карты загружены (WebView)');
      } else if (data.type === 'markerClick') {
        navigation.navigate('StylistDetail', { id: data.stylistId });
      }
    } catch (error) {
      console.error('Ошибка обработки сообщения:', error);
    }
  };

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://api-maps.yandex.ru/2.1/?apikey=f5fec367-762c-4257-bafa-fa0b97a0d6d1&lang=ru_RU" type="text/javascript"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  
  <script>
    let map;
    let markers = [];
    
    ymaps.ready(init);
    
    function init() {
      // Инициализация карты
      map = new ymaps.Map('map', {
        center: [${userLocation?.lat || 55.7558}, ${userLocation?.lon || 37.6173}],
        zoom: ${userLocation ? 14 : 12},
        controls: []
      });
      
      // Добавляем контролы с настройкой позиции
      map.controls.add('zoomControl', {
        position: { right: 10, top: 100 }
      });
      
      // Кнопка геолокации - перемещена ниже (слева по центру)
      map.controls.add('geolocationControl', {
        position: { left: 10, top: 200 }
      });
      
      // Уведомляем React Native что карта загружена
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'mapLoaded'
      }));
      
      // Функция для обновления маркеров
      window.updateMarkers = function(stylistsData) {
        // Удаляем старые маркеры
        markers.forEach(marker => map.geoObjects.remove(marker));
        markers = [];
        
        // Добавляем новые маркеры
        stylistsData.forEach(stylist => {
          const color = stylist.status === 'available' ? '#4CAF50' : '#FFA726';
          
          const placemark = new ymaps.Placemark(
            [stylist.lat, stylist.lon],
            {
              balloonContentHeader: stylist.name,
              balloonContentBody: stylist.mall,
              balloonContentFooter: stylist.status === 'available' ? 'Свободен' : 'Занят',
              hintContent: stylist.name
            },
            {
              preset: 'islands#circleIcon',
              iconColor: color
            }
          );
          
          placemark.events.add('click', function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'markerClick',
              stylistId: stylist.id
            }));
          });
          
          map.geoObjects.add(placemark);
          markers.push(placemark);
        });
      };
      
      ${userLocation ? `
      // Добавляем маркер текущего местоположения
      const userPlacemark = new ymaps.Placemark(
        [${userLocation.lat}, ${userLocation.lon}],
        { hintContent: 'Вы здесь' },
        {
          preset: 'islands#blueDotIcon'
        }
      );
      map.geoObjects.add(userPlacemark);
      ` : ''}
    }
  </script>
</body>
</html>
  `;

  if (loading && stylists.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200ee" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

