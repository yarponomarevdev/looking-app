/**
 * Скрипт для генерации оптимизированных иконок и favicon
 * Создает иконки различных размеров для всех браузеров и устройств
 * 
 * Использует Sharp для обработки изображений
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Путь к исходной иконке (1024x1024 или больше для лучшего качества)
const SOURCE_ICON = path.join(__dirname, '../assets/icon.png');
const PUBLIC_DIR = path.join(__dirname, '../public');

// 🎨 НАСТРОЙКИ СКРУГЛЕНИЯ
// Измените эти значения, чтобы настроить скругление иконок
const ROUNDED_SETTINGS = {
  // Включить/выключить скругление для всех иконок
  enableRounded: true,
  
  // Включить скругление только для больших иконок (PWA, Apple, Android)
  roundedOnlyLargeIcons: true,
  
  // Радиус скругления в процентах от размера (0-50)
  // Например: 25 = 25% от размера иконки
  radiusPercent: 22,
};

// Создаем папку public если её нет
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

/**
 * Создает SVG маску для скругления углов
 * @param {number} size - размер изображения
 * @param {number} radius - радиус скругления
 * @returns {Buffer} SVG маска
 */
function createRoundedMask(size, radius) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>
  `;
  return Buffer.from(svg);
}

/**
 * Применяет скругление углов к изображению
 * @param {Sharp} image - Sharp объект изображения
 * @param {number} size - размер изображения
 * @param {number} radius - радиус скругления
 * @returns {Sharp} Sharp объект со скругленными углами
 */
async function applyRoundedCorners(image, size, radius) {
  const roundedMask = createRoundedMask(size, radius);
  
  return image
    .composite([{
      input: roundedMask,
      blend: 'dest-in'
    }]);
}

/**
 * Конфигурация иконок для генерации
 */
function getIconConfigs() {
  const configs = [
    // Favicon для браузеров
    { name: 'favicon-16x16.png', size: 16, largeIcon: false },
    { name: 'favicon-32x32.png', size: 32, largeIcon: false },
    { name: 'favicon-48x48.png', size: 48, largeIcon: false },
    { name: 'favicon.png', size: 32, largeIcon: false },
    
    // Apple Touch Icon
    { name: 'apple-touch-icon.png', size: 180, largeIcon: true },
    
    // Android Chrome
    { name: 'android-chrome-192x192.png', size: 192, largeIcon: true },
    { name: 'android-chrome-512x512.png', size: 512, largeIcon: true },
    
    // Microsoft Tiles
    { name: 'mstile-150x150.png', size: 150, largeIcon: true },
  ];
  
  // Применяем настройки скругления
  return configs.map(config => {
    const shouldRound = ROUNDED_SETTINGS.enableRounded && 
                       (!ROUNDED_SETTINGS.roundedOnlyLargeIcons || config.largeIcon);
    
    return {
      ...config,
      rounded: shouldRound,
      borderRadius: shouldRound ? Math.round(config.size * ROUNDED_SETTINGS.radiusPercent / 100) : 0
    };
  });
}

/**
 * Генерирует иконки всех размеров из исходного изображения
 */
async function generateIcons() {
  console.log('🎨 Начинаю генерацию иконок...\n');
  
  // Проверяем существование исходной иконки
  if (!fs.existsSync(SOURCE_ICON)) {
    console.error('❌ Исходная иконка не найдена:', SOURCE_ICON);
    process.exit(1);
  }
  
  // Оптимизируем исходные иконки в assets
  console.log('📦 Оптимизация исходных иконок в assets...');
  await optimizeSourceIcons();
  
  // Получаем конфигурацию с учетом настроек скругления
  const iconConfigs = getIconConfigs();
  
  console.log(`\n🔘 Настройки скругления:`);
  console.log(`   Включено: ${ROUNDED_SETTINGS.enableRounded ? 'Да' : 'Нет'}`);
  console.log(`   Только большие иконки: ${ROUNDED_SETTINGS.roundedOnlyLargeIcons ? 'Да' : 'Нет'}`);
  console.log(`   Радиус: ${ROUNDED_SETTINGS.radiusPercent}%\n`);
  
  // Генерируем иконки для public
  for (const config of iconConfigs) {
    const outputPath = path.join(PUBLIC_DIR, config.name);
    
    try {
      // Создаем базовое изображение
      let image = sharp(SOURCE_ICON)
        .resize(config.size, config.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        });
      
      // Применяем скругление если нужно
      if (config.rounded && config.borderRadius) {
        image = await applyRoundedCorners(image, config.size, config.borderRadius);
      }
      
      // Сохраняем файл
      await image
        .png({ 
          quality: 90,
          compressionLevel: 9,
          adaptiveFiltering: true,
          palette: true
        })
        .toFile(outputPath);
      
      const stats = fs.statSync(outputPath);
      const roundedLabel = config.rounded ? ' 🔘' : '';
      console.log(`✅ ${config.name} (${config.size}x${config.size})${roundedLabel} - ${(stats.size / 1024).toFixed(2)} KB`);
    } catch (error) {
      console.error(`❌ Ошибка при создании ${config.name}:`, error.message);
    }
  }
  
  // Генерируем favicon.ico (мультиразмерный)
  console.log('\n🔧 Генерация favicon.ico...');
  await generateFaviconIco();
  
  // Создаем manifest.json
  console.log('\n📄 Создание manifest.json...');
  await generateManifest();
  
  console.log('\n✨ Генерация иконок завершена!');
  console.log(`📁 Все иконки сохранены в: ${PUBLIC_DIR}`);
}

/**
 * Оптимизирует исходные иконки в папке assets
 */
async function optimizeSourceIcons() {
  const assetsDir = path.join(__dirname, '../assets');
  const icons = ['icon.png', 'adaptive-icon.png', 'splash-icon.png', 'favicon.png'];
  
  for (const icon of icons) {
    const iconPath = path.join(assetsDir, icon);
    if (!fs.existsSync(iconPath)) continue;
    
    const tempPath = iconPath + '.tmp';
    const originalSize = fs.statSync(iconPath).size;
    
    try {
      await sharp(iconPath)
        .png({ 
          quality: 90,
          compressionLevel: 9,
          adaptiveFiltering: true,
          palette: true
        })
        .toFile(tempPath);
      
      const newSize = fs.statSync(tempPath).size;
      
      // Заменяем только если новый файл меньше
      if (newSize < originalSize) {
        fs.unlinkSync(iconPath);
        fs.renameSync(tempPath, iconPath);
        console.log(`  ✓ ${icon}: ${(originalSize / 1024 / 1024).toFixed(2)} MB → ${(newSize / 1024).toFixed(2)} KB`);
      } else {
        fs.unlinkSync(tempPath);
        console.log(`  ✓ ${icon}: уже оптимизирован (${(originalSize / 1024).toFixed(2)} KB)`);
      }
    } catch (error) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      console.error(`  ✗ Ошибка при оптимизации ${icon}:`, error.message);
    }
  }
}

/**
 * Генерирует favicon.ico из PNG иконок
 */
async function generateFaviconIco() {
  // Sharp не поддерживает ICO напрямую, поэтому создаем PNG версию
  // Браузеры отлично работают с PNG favicon
  const faviconPath = path.join(PUBLIC_DIR, 'favicon.ico');
  const sourceFavicon = path.join(PUBLIC_DIR, 'favicon-32x32.png');
  
  try {
    fs.copyFileSync(sourceFavicon, faviconPath);
    console.log('✅ favicon.ico создан (PNG format)');
  } catch (error) {
    console.error('❌ Ошибка при создании favicon.ico:', error.message);
  }
}

/**
 * Создает manifest.json для PWA
 */
async function generateManifest() {
  const manifest = {
    name: 'Looking',
    short_name: 'Looking',
    description: 'Looking - находите стилистов рядом с вами',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#6200ee',
    orientation: 'portrait',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  };
  
  const manifestPath = path.join(PUBLIC_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ manifest.json создан');
}

// Запускаем генерацию
generateIcons().catch(error => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});

