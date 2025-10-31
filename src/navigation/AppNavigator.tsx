/**
 * Главная навигация приложения
 * Содержит условный рендеринг для авторизованных/неавторизованных пользователей
 * Использует Stack Navigator и Tab Navigator
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';

import MapScreenWebView from '../screens/MapScreenWebView';
import StylistListScreen from '../screens/StylistListScreen';
import StylistDetailScreen from '../screens/StylistDetailScreen';
import AuthScreen from '../screens/AuthScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tab.Screen 
        name="Map" 
        component={MapScreenWebView} 
        options={{ 
          title: 'Карта',
          headerShown: false,
        }} 
      />
      <Tab.Screen 
        name="List" 
        component={StylistListScreen} 
        options={{ 
          title: 'Список',
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          title: 'Профиль',
        }} 
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen} 
            options={{ headerShown: false }} 
          />
        ) : (
          <>
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

