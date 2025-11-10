/**
 * Конфигурация Metro Bundler
 * Настройки для правильной обработки assets, особенно для веб-платформы
 */

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Настройка для web платформы
config.resolver.assetExts.push(
  // Fonts
  'ttf',
  'otf',
  'woff',
  'woff2'
);

// Исключаем проблемные директории из обработки
config.resolver.blockList = [
  // Игнорируем несуществующие директории с шрифтами, которые metro пытается сканировать
  /node_modules\/.*\/Fonts\/.*/,
  /node_modules\/@expo\/vector-icons\/build\/vendor\/react-native-vector-icons\/Fonts\/.*/
];

// Для веб-платформы используем алиасы
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  // Перенаправляем пути к шрифтам для веба
  'react-native-vector-icons': path.resolve(__dirname, 'node_modules/@expo/vector-icons'),
};

module.exports = config;

