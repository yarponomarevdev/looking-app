/**
 * Конфигурация Babel для Expo приложения
 * Добавляет поддержку переменных окружения через react-native-dotenv
 */

module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          safe: false,
          allowUndefined: true,
          verbose: false,
        },
      ],
    ],
  };
};

