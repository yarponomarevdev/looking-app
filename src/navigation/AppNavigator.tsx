/**
 * Главная навигация приложения
 * Содержит условный рендеринг для авторизованных/неавторизованных пользователей
 * Использует Stack Navigator и Tab Navigator
 */

import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import NotificationBadge from '../components/notifications/NotificationBadge';

import MapScreen from '../screens/MapScreen';
import StylistListScreen from '../screens/StylistListScreen';
import StylistDetailScreen from '../screens/StylistDetailScreen';
import AuthScreen from '../screens/AuthScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BookingsScreen from '../screens/BookingsScreen';
import StylistBookingsScreen from '../screens/StylistBookingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import EditStylistProfileScreen from '../screens/EditStylistProfileScreen';
import FeedScreen from '../screens/FeedScreen';
import CreateLookScreen from '../screens/CreateLookScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { user } = useAuthStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    if (user) {
      fetchNotifications(user.id);
    }
  }, [user]);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tab.Screen 
        name="Feed" 
        component={FeedScreen} 
        options={{ 
          title: 'Лента',
          tabBarIcon: ({ color, size, focused }) => (
            <Text>
              <Ionicons 
                name={focused ? 'images' : 'images-outline'} 
                size={size} 
                color={color} 
              />
            </Text>
          ),
        }} 
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen} 
        options={{ 
          title: 'Карта',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Text>
              <Ionicons 
                name={focused ? 'map' : 'map-outline'} 
                size={size} 
                color={color} 
              />
            </Text>
          ),
        }} 
      />
      <Tab.Screen 
        name="List" 
        component={StylistListScreen} 
        options={{ 
          title: 'Список',
          tabBarIcon: ({ color, size, focused }) => (
            <Text>
              <Ionicons 
                name={focused ? 'list' : 'list-outline'} 
                size={size} 
                color={color} 
              />
            </Text>
          ),
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          title: 'Профиль',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ position: 'relative' }}>
              <Text>
                <Ionicons 
                  name={focused ? 'person' : 'person-outline'} 
                  size={size} 
                  color={color} 
                />
              </Text>
              {unreadCount > 0 && (
                <View style={{ position: 'absolute', top: -5, right: -10 }}>
                  <NotificationBadge count={unreadCount} />
                </View>
              )}
            </View>
          ),
        }} 
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user } = useAuthStore();

  // Конфигурация deep linking для шеринга образов
  const linking = React.useMemo(() => ({
    prefixes: ['https://looking-web.vercel.app', 'http://looking-web.vercel.app', 'looking-app://'],
    config: {
      screens: {
        Main: {
          path: '',
          initialRouteName: 'Feed', // Явно указываем начальный экран
          screens: {
            Feed: {
              // Путь '' позволяет открывать Feed на корневом URL /
              // А также по прямому пути React Navigation будет обрабатывать /feed
              path: '',
              parse: {
                stylist: (stylist: string) => stylist,
                look: (look: string) => look,
              },
            },
            Map: 'map',
            List: 'list',
            Profile: 'profile',
          },
        },
        StylistDetail: {
          path: 'stylist/:id',
          parse: {
            id: (id: string) => id,
            selectedLookId: (lookId: string) => lookId,
          },
        },
      },
    },
    // Обработчик входящих URL для query параметров
    getStateFromPath: (path: string, config: any) => {
      try {
        // Парсим URL, обрабатывая разные форматы
        let urlObj: URL;
        
        if (path.startsWith('http')) {
          urlObj = new URL(path);
        } else if (path.startsWith('/')) {
          urlObj = new URL(`https://looking-web.vercel.app${path}`);
        } else if (path.includes('?')) {
          // Если это query-параметры без домена
          urlObj = new URL(`https://looking-web.vercel.app/?${path.split('?')[1]}`);
        } else {
          urlObj = new URL(`https://looking-web.vercel.app/${path}`);
        }
        
        const stylistId = urlObj.searchParams.get('stylist');
        const lookId = urlObj.searchParams.get('look');
        
        console.log('Deep link parsed:', { path, stylistId, lookId });
        
        // Если есть параметры stylist и look, открываем Feed с параметрами
        // Feed сам обработает эти параметры и откроет модальное окно с образом
        if (stylistId && lookId) {
          return {
            routes: [
              { 
                name: 'Main',
                state: {
                  routes: [
                    { 
                      name: 'Feed',
                      params: {
                        stylist: stylistId,
                        look: lookId,
                      }
                    }
                  ],
                  index: 0,
                }
              },
            ],
          };
        }
      } catch (error) {
        console.error('Error parsing deep link:', error);
      }
      
      // Используем стандартную обработку для остальных путей
      return undefined;
    },
  }), []);

  return (
    <NavigationContainer 
      linking={linking}
      fallback={<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}><ActivityIndicator size="large" color="#6200ee" /></View>}
    >
      <Stack.Navigator>
        {/* Публичные экраны всегда доступны */}
        <Stack.Screen 
          name="Main" 
          component={MainTabs} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="StylistDetail" 
          component={StylistDetailScreen} 
          options={{ title: 'Профиль стилиста' }} 
        />
        
        {/* Экран авторизации */}
        <Stack.Screen 
          name="Auth" 
          component={AuthScreen} 
          options={{ 
            headerShown: false,
            presentation: 'modal' // Открывается как модальное окно
          }} 
        />
        
        {/* Приватные экраны - доступны только авторизованным */}
        {user && (
          <>
            <Stack.Screen 
              name="Bookings" 
              component={BookingsScreen} 
              options={{ title: 'Мои записи' }} 
            />
            <Stack.Screen 
              name="StylistBookings" 
              component={StylistBookingsScreen} 
              options={{ title: 'Запросы на встречи' }} 
            />
            <Stack.Screen 
              name="Notifications" 
              component={NotificationsScreen} 
              options={{ title: 'Уведомления' }} 
            />
            <Stack.Screen 
              name="EditStylistProfile" 
              component={EditStylistProfileScreen} 
              options={{ title: 'Редактировать профиль' }} 
            />
            <Stack.Screen 
              name="CreateLook" 
              component={CreateLookScreen} 
              options={{ title: 'Создать образ' }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

