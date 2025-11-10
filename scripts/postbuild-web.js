/**
 * Post-build скрипт для веб-версии
 * Копирует все необходимые статические файлы (иконки, manifest) в dist
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '../public');
const DIST_DIR = path.join(__dirname, '../dist');

/**
 * Копирует файл из source в destination
 */
function copyFile(source, destination) {
  try {
    fs.copyFileSync(source, destination);
    const fileName = path.basename(source);
    const fileSize = (fs.statSync(destination).size / 1024).toFixed(2);
    console.log(`✅ ${fileName} (${fileSize} KB)`);
  } catch (error) {
    console.error(`❌ Ошибка при копировании ${path.basename(source)}:`, error.message);
  }
}

/**
 * Обрабатывает service-worker.js и обновляет BUILD_DATE
 */
function processServiceWorker(sourcePath, destPath) {
  try {
    let content = fs.readFileSync(sourcePath, 'utf8');
    
    // Заменяем BUILD_DATE на текущую дату
    const buildDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
    content = content.replace(
      new RegExp("const BUILD_DATE = new Date\\(\\)\\.toISOString\\(\\)\\.split\\('T'\\)\\[0\\]\\.replace\\(\\/-/g, ''\\);"),
      `const BUILD_DATE = '${buildDate}';`
    );
    
    fs.writeFileSync(destPath, content);
    const fileSize = (fs.statSync(destPath).size / 1024).toFixed(2);
    console.log(`✅ service-worker.js (${fileSize} KB) - версия кэша: v${buildDate}`);
  } catch (error) {
    console.error(`❌ Ошибка при обработке service-worker.js:`, error.message);
  }
}

/**
 * Основная функция
 */
function postBuild() {
  console.log('📦 Post-build: копирование статических файлов...\n');
  
  // Проверяем существование папок
  if (!fs.existsSync(PUBLIC_DIR)) {
    console.error('❌ Папка public не найдена!');
    process.exit(1);
  }
  
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Папка dist не найдена! Сначала выполните npm run build.');
    process.exit(1);
  }
  
  // Список файлов для копирования
  const files = [
    'favicon.ico',
    'favicon.png',
    'favicon-16x16.png',
    'favicon-32x32.png',
    'favicon-48x48.png',
    'apple-touch-icon.png',
    'android-chrome-192x192.png',
    'android-chrome-512x512.png',
    'mstile-150x150.png',
    'manifest.json',
    'service-worker.js'
  ];
  
  // Копируем каждый файл
  for (const file of files) {
    const sourcePath = path.join(PUBLIC_DIR, file);
    const destPath = path.join(DIST_DIR, file);
    
    if (fs.existsSync(sourcePath)) {
      // Service Worker обрабатываем отдельно
      if (file === 'service-worker.js') {
        processServiceWorker(sourcePath, destPath);
      } else {
        copyFile(sourcePath, destPath);
      }
    } else {
      console.warn(`⚠️  ${file} не найден в public`);
    }
  }
  
  console.log('\n✨ Post-build завершен!');
  console.log(`📁 Файлы скопированы в: ${DIST_DIR}`);
}

postBuild();

