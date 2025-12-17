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

// Используем дефолтное разрешение путей без блок-листов и алиасов,
// чтобы Metro корректно находил font assets в пакете @expo/vector-icons

module.exports = config;

