/**
 * Конфигурация Expo с настройкой Яндекс.Карт
 * Включает config plugin для правильной инициализации на iOS
 */

import { ExpoConfig, ConfigContext } from '@expo/config';
import { withAppDelegate, ConfigPlugin } from 'expo/config-plugins';

// Config plugin для интеграции Яндекс.Карт на iOS
const withYandexMaps: ConfigPlugin = (config) => {
  return withAppDelegate(config, async (config) => {
    const appDelegate = config.modResults;

    // Добавляем импорт YandexMapsMobile
    if (!appDelegate.contents.includes('#import <YandexMapsMobile/YMKMapKitFactory.h>')) {
      appDelegate.contents = appDelegate.contents.replace(
        /#import "AppDelegate.h"/g,
        `#import "AppDelegate.h"\n#import <YandexMapsMobile/YMKMapKitFactory.h>`
      );
    }

    // Получаем API ключ из переменных окружения
    const mapKitApiKey = process.env.YANDEX_MAPS_API_KEY || 'YOUR_YANDEX_MAPS_API_KEY';

    const mapKitMethodInvocations = [
      `[YMKMapKit setApiKey:@"${mapKitApiKey}"];`,
      `[YMKMapKit setLocale:@"ru_RU"];`,
      `[YMKMapKit mapKit];`,
    ]
      .map((line) => `\t${line}`)
      .join('\n');

    // Добавляем инициализацию в didFinishLaunchingWithOptions
    if (!appDelegate.contents.includes(mapKitMethodInvocations)) {
      appDelegate.contents = appDelegate.contents.replace(
        /\s+return YES;/g,
        `\n\n${mapKitMethodInvocations}\n\n\treturn YES;`
      );
    }

    return config;
  });
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Looking',
  slug: 'looking-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.looking.app',
  },
  android: {
    package: 'com.looking.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
    ],
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission: 'Приложению нужен доступ к геолокации для отображения стилистов рядом с вами.',
      },
    ],
    withYandexMaps, // Config plugin для Яндекс.Карт
  ],
  extra: {
    mapKitApiKey: process.env.YANDEX_MAPS_API_KEY || 'YOUR_YANDEX_MAPS_API_KEY',
  },
});

