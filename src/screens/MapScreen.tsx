/**
 * Главный экран приложения с картой стилистов
 * Отображает Яндекс.Карты через WebView (мобильные) или iframe (веб)
 * Поддерживает геолокацию пользователя и real-time обновления
 * Кроссплатформенная версия с поддержкой iOS, Android и Web
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { useStylistStore } from '../store/stylistStore';
import { Stylist } from '../types';
import { MOSCOW_MALLS_WITH_COORDS } from '../constants/malls';
import StylistBottomSheet from '../components/map/StylistBottomSheet';
import MallStylistsBottomSheet from '../components/map/MallStylistsBottomSheet';
import BookingModal from '../components/booking/BookingModal';

// Импорты для разных платформ
let WebView: any;
let WebViewMessageEvent: any;
if (Platform.OS !== 'web') {
  const RNWebView = require('react-native-webview');
  WebView = RNWebView.WebView;
  WebViewMessageEvent = RNWebView.WebViewMessageEvent;
}

export default function MapScreen({ navigation }: any) {
  const { stylists, loading, fetchStylists, subscribeToUpdates } = useStylistStore();
  const webViewRef = useRef<WebView>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [selectedMall, setSelectedMall] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);


  // Перезагружаем данные при фокусе на экран
  useFocusEffect(
    useCallback(() => {
      fetchStylists();
    }, [])
  );

  useEffect(() => {
    initializeLocation();
    fetchStylists();
    const unsubscribe = subscribeToUpdates();
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (mapLoaded) {
      updateMallMarkers();
    }
  }, [stylists, mapLoaded]);

  const initializeLocation = async () => {
    try {
      // На веб используем браузерное API геолокации
      if (Platform.OS === 'web') {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setUserLocation({
                lat: position.coords.latitude,
                lon: position.coords.longitude,
              });
            },
            (error) => {
              console.error('Ошибка получения геолокации (веб):', error);
            }
          );
        }
      } else {
        // На мобильных используем expo-location
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
      }
    } catch (error) {
      console.error('Ошибка получения геолокации:', error);
    }
  };

  // Метки стилистов убраны - показываем только метки торговых центров

  const updateMallMarkers = () => {
    // Подсчитываем количество стилистов для каждого ТЦ
    const mallsData = MOSCOW_MALLS_WITH_COORDS.map((mall) => {
      const stylistsCount = stylists.filter(s => 
        s.malls && s.malls.includes(mall.name)
      ).length;

      return {
        name: mall.name,
        lat: mall.latitude,
        lon: mall.longitude,
        address: mall.address,
        stylistsCount,
      };
    });

    if (Platform.OS === 'web') {
      // На веб отправляем сообщение в iframe
      const iframe = document.getElementById('yandex-map-iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'updateMallMarkers',
          data: mallsData
        }, '*');
      }
    } else {
      // На мобильных используем injectJavaScript
      const jsCode = `
        if (window.updateMallMarkers) {
          window.updateMallMarkers(${JSON.stringify(mallsData)});
        }
        true;
      `;
      webViewRef.current?.injectJavaScript(jsCode);
    }
  };

  // Обработчик сообщений от WebView (мобильные)
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'mapLoaded') {
        setMapLoaded(true);
      } else if (data.type === 'mallMarkerClick') {
        setSelectedMall(data.mallName);
      }
    } catch (error) {
      console.error('Ошибка обработки сообщения:', error);
    }
  };

  // Обработчик сообщений от iframe (веб)
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleWebMessage = (event: MessageEvent) => {
        try {
          const data = event.data;
          
          if (data.type === 'mapLoaded') {
            setMapLoaded(true);
          } else if (data.type === 'mallMarkerClick') {
            setSelectedMall(data.mallName);
          }
        } catch (error) {
          console.error('Ошибка обработки веб-сообщения:', error);
        }
      };

      window.addEventListener('message', handleWebMessage);
      return () => window.removeEventListener('message', handleWebMessage);
    }
  }, []);

  // Дополнительная логика для веб: повторная отправка маркеров после загрузки
  useEffect(() => {
    if (Platform.OS === 'web' && mapLoaded && stylists.length > 0) {
      const timer = setTimeout(() => {
        updateMallMarkers();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [mapLoaded, stylists]);

  const handleCloseBottomSheet = () => {
    setSelectedStylist(null);
  };

  const handleCloseMallBottomSheet = () => {
    setSelectedMall(null);
  };

  const handleMallStylistPress = (stylist: Stylist) => {
    setSelectedMall(null);
    setSelectedStylist(stylist);
  };

  const handleBookPress = () => {
    setShowBookingModal(true);
  };

  const handleDetailsPress = () => {
    if (selectedStylist) {
      setSelectedStylist(null);
      navigation.navigate('StylistDetail', { id: selectedStylist.id });
    }
  };

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    setSelectedStylist(null);
  };

  // Генерируем HTML контент для карты (работает и в WebView, и в iframe)
  const getMapHTML = () => {
    const isWeb = Platform.OS === 'web';
    
    return `
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
    let mallMarkers = [];
    
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
      
      // Кнопка геолокации
      map.controls.add('geolocationControl', {
        position: { left: 10, top: 200 }
      });
      
      // Уведомляем родительское окно что карта загружена
      ${isWeb ? `
      window.parent.postMessage({
        type: 'mapLoaded'
      }, '*');
      ` : `
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'mapLoaded'
        }));
      }
      `}
      
      // Функция для обновления маркеров торговых центров
      window.updateMallMarkers = function(mallsData) {
        // Удаляем старые маркеры ТЦ
        mallMarkers.forEach(marker => map.geoObjects.remove(marker));
        mallMarkers = [];
        
        // Добавляем новые маркеры ТЦ
        mallsData.forEach(mall => {
          const placemark = new ymaps.Placemark(
            [mall.lat, mall.lon],
            {
              balloonContentHeader: '<strong>' + mall.name + '</strong>',
              balloonContentBody: mall.address + '<br/>Стилистов: ' + mall.stylistsCount,
              hintContent: mall.name + ' (стилистов: ' + mall.stylistsCount + ')',
              iconContent: String(mall.stylistsCount)
            },
            {
              preset: 'islands#violetStretchyIcon',
              iconColor: mall.stylistsCount > 0 ? '#9C27B0' : '#CCCCCC'
            }
          );
          
          // Обработчик клика на метку
          placemark.events.add('click', function() {
            ${isWeb ? `
            window.parent.postMessage({
              type: 'mallMarkerClick',
              mallName: mall.name
            }, '*');
            ` : `
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mallMarkerClick',
                mallName: mall.name
              }));
            }
            `}
          });
          
          map.geoObjects.add(placemark);
          mallMarkers.push(placemark);
        });
      };
      
      ${isWeb ? `
      // Слушаем сообщения от родительского окна (веб)
      window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'updateMallMarkers') {
          window.updateMallMarkers(event.data.data);
        }
      });
      ` : ''}
      
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
  };

  if (loading && stylists.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  // Рендер карты для веб-платформы (iframe)
  const renderWebMap = () => {
    const htmlContent = getMapHTML();

    return (
      <iframe
        id="yandex-map-iframe"
        srcDoc={htmlContent}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        title="Яндекс.Карты"
      />
    );
  };

  // Рендер карты для мобильных платформ (WebView)
  const renderMobileMap = () => {
    const htmlContent = getMapHTML();

    return (
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
    );
  };

  return (
    <View style={styles.container}>
      {/* Карта - адаптивная для разных платформ */}
      {Platform.OS === 'web' ? renderWebMap() : renderMobileMap()}

      {/* Bottom Sheet для информации о стилисте */}
      <StylistBottomSheet
        stylist={selectedStylist}
        visible={!!selectedStylist}
        onClose={handleCloseBottomSheet}
        onBookPress={handleBookPress}
        onDetailsPress={handleDetailsPress}
      />

      {/* Bottom Sheet для списка стилистов торгового центра */}
      <MallStylistsBottomSheet
        mallName={selectedMall}
        stylists={stylists.filter(s => s.malls && s.malls.includes(selectedMall || ''))}
        visible={!!selectedMall}
        onClose={handleCloseMallBottomSheet}
        onStylistPress={handleMallStylistPress}
      />

      {/* Модальное окно бронирования */}
      {selectedStylist && (
        <BookingModal
          visible={showBookingModal}
          stylistId={selectedStylist.id}
          stylistName={selectedStylist.full_name}
          onClose={() => setShowBookingModal(false)}
          onSuccess={handleBookingSuccess}
        />
      )}
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

