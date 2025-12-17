/**
 * Утилита для выбора изображений на веб-платформе
 * Решает проблему с определением типов файлов в expo-image-picker на вебе
 */

import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/**
 * MIME-типы для атрибута accept в HTML input
 */
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
].join(',');

/**
 * Опции для ImagePicker с поддержкой веба
 */
export interface ImagePickerOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}

/**
 * Обёртка над expo-image-picker с улучшенной поддержкой веба
 * На вебе устанавливает правильный атрибут accept для input
 */
export async function launchImageLibraryWithWebSupport(
  options: ImagePickerOptions = {}
): Promise<ImagePicker.ImagePickerResult> {
  try {
    // На вебе добавляем специальную обработку
    if (Platform.OS === 'web') {
      // Создаём input с правильным accept атрибутом
      return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = ACCEPTED_IMAGE_TYPES;
        input.multiple = false;
        
        input.onchange = async (e: Event) => {
          const target = e.target as HTMLInputElement;
          const file = target.files?.[0];
          
          if (!file) {
            resolve({ canceled: true, assets: [] });
            return;
          }
          
          // Получаем расширение файла
          const extension = file.name.split('.').pop()?.toLowerCase() || '';
          
          // Список поддерживаемых расширений
          const supportedExtensions = [
            'jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 
            'gif', 'bmp', 'tiff', 'tif', 'svg'
          ];
          
          // Проверяем по MIME-типу ИЛИ по расширению
          // (браузеры на Windows не всегда правильно определяют MIME для HEIC)
          const isValidByMimeType = file.type.startsWith('image/');
          const isValidByExtension = supportedExtensions.includes(extension);
          
          if (!isValidByMimeType && !isValidByExtension) {
            reject(new Error(`Формат .${extension.toUpperCase()} не поддерживается. Пожалуйста, выберите изображение.`));
            return;
          }
          
          try {
            // Определяем правильный MIME-тип заранее
            // Если браузер не определил, используем расширение
            let correctMimeType = file.type;
            if (!correctMimeType && extension) {
              // Конвертируем расширение в MIME-тип
              const mimeMap: Record<string, string> = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'webp': 'image/webp',
                'heic': 'image/heic',
                'heif': 'image/heif',
                'gif': 'image/gif',
                'bmp': 'image/bmp',
                'tiff': 'image/tiff',
                'tif': 'image/tiff',
                'svg': 'image/svg+xml',
              };
              correctMimeType = mimeMap[extension] || 'image/jpeg';
            }
            
            // Читаем файл как Data URL
            const reader = new FileReader();
            reader.onload = () => {
              let dataUrl = reader.result as string;
              
              // Исправляем MIME-тип в Data URL если нужно
              // FileReader может создать "data:application/octet-stream" для HEIC
              if (dataUrl.startsWith('data:application/octet-stream') || 
                  dataUrl.startsWith('data:;base64') ||
                  !dataUrl.startsWith('data:image/')) {
                // Заменяем неправильный MIME-тип на правильный
                const base64Data = dataUrl.split(',')[1];
                dataUrl = `data:${correctMimeType};base64,${base64Data}`;
              }
              
              console.log('Файл выбран:', {
                name: file.name,
                extension,
                originalMimeType: file.type,
                finalMimeType: correctMimeType,
                dataUrlPrefix: dataUrl.substring(0, 50),
                size: file.size,
              });
              
              // Формируем результат в формате ImagePicker
              resolve({
                canceled: false,
                assets: [{
                  uri: dataUrl,
                  width: 0,
                  height: 0,
                  type: 'image',
                  fileName: file.name,
                  fileSize: file.size,
                  mimeType: correctMimeType,
                }],
              });
            };
            reader.onerror = () => reject(new Error('Ошибка чтения файла'));
            reader.readAsDataURL(file);
          } catch (error) {
            reject(error);
          }
        };
        
        input.oncancel = () => {
          resolve({ canceled: true, assets: [] });
        };
        
        // Программно кликаем на input
        input.click();
      });
    }
    
    // На мобильных используем стандартный ImagePicker
    return await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: options.allowsEditing ?? true,
      aspect: options.aspect,
      quality: options.quality ?? 0.8,
      allowsMultipleSelection: false,
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Запросить разрешение на доступ к галерее
 * На вебе всегда возвращает granted
 */
export async function requestMediaLibraryPermissions(): Promise<ImagePicker.MediaLibraryPermissionResponse> {
  if (Platform.OS === 'web') {
    // На вебе разрешения не требуются
    return {
      status: 'granted' as ImagePicker.PermissionStatus,
      granted: true,
      canAskAgain: false,
      expires: 'never',
    };
  }
  
  return await ImagePicker.requestMediaLibraryPermissionsAsync();
}

