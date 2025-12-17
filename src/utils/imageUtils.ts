/**
 * Утилиты для работы с изображениями
 * Поддержка HEIC, JPEG, PNG, WebP и других форматов
 */

import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { logger } from './logger';

// Динамический импорт heic2any только для веба
let heic2any: any = null;
if (Platform.OS === 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    heic2any = require('heic2any');
  } catch (e) {
    logger.warn('heic2any не доступен, конвертация HEIC на вебе будет ограничена');
  }
}

/**
 * Маппинг расширений файлов на MIME-типы
 */
const MIME_TYPES: Record<string, string> = {
  // JPEG
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  
  // PNG
  png: 'image/png',
  
  // WebP
  webp: 'image/webp',
  
  // HEIC/HEIF (Apple форматы)
  heic: 'image/heic',
  heif: 'image/heif',
  
  // GIF
  gif: 'image/gif',
  
  // BMP
  bmp: 'image/bmp',
  
  // TIFF
  tiff: 'image/tiff',
  tif: 'image/tiff',
  
  // SVG
  svg: 'image/svg+xml',
  
  // ICO
  ico: 'image/x-icon',
};

/**
 * Форматы, которые нужно конвертировать в JPEG
 * HEIC не поддерживается многими браузерами и системами
 */
const FORMATS_TO_CONVERT = ['heic', 'heif', 'bmp', 'tiff', 'tif'];

/**
 * Поддерживаемые форматы изображений
 */
const SUPPORTED_FORMATS = Object.keys(MIME_TYPES);

/**
 * Результат валидации изображения
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  suggestedFormats?: string;
}

/**
 * Получить MIME-тип по расширению файла
 */
export function getMimeType(fileExtension: string): string {
  const ext = fileExtension.toLowerCase().replace('.', '');
  return MIME_TYPES[ext] || 'image/jpeg';
}

/**
 * Получить расширение файла из URI
 * Поддерживает Data URL (для веба) и обычные URI
 */
export function getFileExtension(uri: string): string {
  // Проверяем, является ли это Data URL (для веба)
  if (uri.startsWith('data:')) {
    const match = uri.match(/^data:image\/([a-z]+);/);
    if (match && match[1]) {
      // Конвертируем MIME-тип в расширение
      const mimeType = match[1];
      if (mimeType === 'jpeg') return 'jpg';
      if (mimeType === 'svg+xml') return 'svg';
      return mimeType; // png, webp, gif, bmp и т.д.
    }
  }
  
  // Обычный URI с расширением
  const parts = uri.split('.');
  const ext = parts[parts.length - 1].split('?')[0]; // Убираем query параметры если есть
  return ext.toLowerCase();
}

/**
 * Получить MIME-тип из Data URL или по расширению
 */
export function getMimeTypeFromUri(uri: string): string | null {
  // Проверяем Data URL
  if (uri.startsWith('data:')) {
    const match = uri.match(/^data:([^;]+);/);
    if (match && match[1]) {
      return match[1]; // например, "image/jpeg"
    }
  }
  
  // Получаем по расширению
  const ext = getFileExtension(uri);
  return ext ? getMimeType(ext) : null;
}

/**
 * Проверить, нужно ли конвертировать формат
 */
export function shouldConvertFormat(fileExtension: string): boolean {
  const ext = fileExtension.toLowerCase().replace('.', '');
  return FORMATS_TO_CONVERT.includes(ext);
}

/**
 * Конвертировать HEIC в JPEG на вебе используя heic2any
 */
async function convertHeicOnWeb(
  dataUrl: string,
  quality: number = 0.8
): Promise<string> {
  if (!heic2any) {
    throw new Error('heic2any не доступен для конвертации HEIC');
  }

  try {
    // Конвертируем Data URL в Blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    // Конвертируем HEIC в JPEG используя heic2any
    const convertedBlob = await heic2any({
      blob,
      toType: 'image/jpeg',
      quality: quality,
    });
    
    // heic2any возвращает массив, берём первый элемент
    const jpegBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    
    // Конвертируем Blob обратно в Data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(jpegBlob);
    });
  } catch (error) {
    logger.error('Ошибка конвертации HEIC на вебе:', error);
    throw error;
  }
}

/**
 * Конвертировать изображение в JPEG если нужно
 * Для HEIC и других неподдерживаемых форматов
 * Поддерживает Data URL (веб) и обычные URI (мобильные)
 */
export async function convertImageIfNeeded(
  uri: string,
  maxWidth?: number,
  maxHeight?: number,
  quality: number = 0.8
): Promise<{ uri: string; fileExtension: string; mimeType: string }> {
  try {
    const originalExtension = getFileExtension(uri);
    const originalMimeType = getMimeTypeFromUri(uri) || getMimeType(originalExtension);
    
    // Проверяем, нужна ли конвертация
    if (shouldConvertFormat(originalExtension)) {
      logger.log(`Конвертация ${originalExtension} в JPEG...`);
      
      // На вебе для HEIC используем heic2any
      if (Platform.OS === 'web' && (originalExtension === 'heic' || originalExtension === 'heif')) {
        try {
          const convertedDataUrl = await convertHeicOnWeb(uri, quality);
          
          logger.log('HEIC успешно конвертирован в JPEG на вебе');
          
          return {
            uri: convertedDataUrl,
            fileExtension: 'jpg',
            mimeType: 'image/jpeg',
          };
        } catch (error) {
          logger.error('Ошибка конвертации HEIC на вебе, пробуем стандартный метод:', error);
          // Продолжаем со стандартным методом как fallback
        }
      }
      
      // Для мобильных или других форматов используем expo-image-manipulator
      const manipulateOptions: ImageManipulator.Action[] = [];
      
      // Добавляем resize если указаны размеры
      if (maxWidth || maxHeight) {
        manipulateOptions.push({
          resize: {
            width: maxWidth,
            height: maxHeight,
          },
        });
      }
      
      // Конвертируем в JPEG
      const result = await ImageManipulator.manipulateAsync(
        uri,
        manipulateOptions,
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      
      logger.log('Изображение успешно конвертировано в JPEG');
      
      return {
        uri: result.uri,
        fileExtension: 'jpg',
        mimeType: 'image/jpeg',
      };
    }
    
    // Если конвертация не нужна, возвращаем оригинал
    return {
      uri,
      fileExtension: originalExtension,
      mimeType: originalMimeType,
    };
  } catch (error) {
    logger.error('Ошибка при конвертации изображения:', error);
    
    // В случае ошибки возвращаем оригинал
    const ext = getFileExtension(uri);
    const mimeType = getMimeTypeFromUri(uri) || getMimeType(ext);
    return {
      uri,
      fileExtension: ext,
      mimeType,
    };
  }
}

/**
 * Подготовить изображение для загрузки
 * Возвращает ArrayBuffer, готовый для отправки в Supabase Storage
 */
export async function prepareImageForUpload(
  uri: string,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    onProgress?: (message: string) => void;
  }
): Promise<{
  arrayBuffer: ArrayBuffer;
  fileExtension: string;
  mimeType: string;
}> {
  try {
    const originalExtension = getFileExtension(uri);
    const needsConversion = shouldConvertFormat(originalExtension);
    
    // Уведомляем о начале конвертации если нужно
    if (needsConversion && options?.onProgress) {
      options.onProgress(`Конвертация ${originalExtension.toUpperCase()} в JPEG...`);
    }
    
    // Конвертируем изображение если нужно
    const { uri: processedUri, fileExtension, mimeType } = 
      await convertImageIfNeeded(
        uri, 
        options?.maxWidth, 
        options?.maxHeight, 
        options?.quality
      );
    
    // Уведомляем о завершении конвертации
    if (needsConversion && options?.onProgress) {
      options.onProgress('Подготовка к загрузке...');
    }
    
    // Загружаем файл как ArrayBuffer
    const response = await fetch(processedUri);
    const arrayBuffer = await response.arrayBuffer();
    
    return {
      arrayBuffer,
      fileExtension,
      mimeType,
    };
  } catch (error) {
    logger.error('Ошибка при подготовке изображения:', error);
    throw error;
  }
}

/**
 * Создать имя файла для загрузки
 */
export function generateFileName(
  prefix: string = '',
  extension: string = 'jpg'
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const cleanExt = extension.toLowerCase().replace('.', '');
  
  if (prefix) {
    return `${prefix}-${timestamp}-${random}.${cleanExt}`;
  }
  
  return `${timestamp}-${random}.${cleanExt}`;
}

/**
 * Проверить, поддерживается ли формат файла
 */
export function isSupportedFormat(fileExtension: string): boolean {
  const ext = fileExtension.toLowerCase().replace('.', '');
  return SUPPORTED_FORMATS.includes(ext);
}

/**
 * Получить список поддерживаемых форматов в читаемом виде
 */
export function getSupportedFormatsString(): string {
  // Группируем форматы для лучшей читаемости
  const main = ['JPEG', 'PNG', 'WebP', 'HEIC'];
  const additional = ['GIF', 'BMP', 'TIFF'];
  
  return `${main.join(', ')}, ${additional.join(', ')}`;
}

/**
 * Валидация изображения перед загрузкой
 * Проверяет формат и возвращает понятное сообщение об ошибке
 * Поддерживает Data URL (веб) и обычные URI (мобильные)
 */
export function validateImage(uri: string): ValidationResult {
  try {
    // Проверяем, что URI не пустой
    if (!uri || uri.trim() === '') {
      return {
        isValid: false,
        error: 'Файл не выбран',
      };
    }

    // Для Data URL проверяем MIME-тип напрямую
    if (uri.startsWith('data:')) {
      const mimeType = getMimeTypeFromUri(uri);
      
      if (!mimeType) {
        return {
          isValid: false,
          error: 'Не удалось определить формат файла',
          suggestedFormats: getSupportedFormatsString(),
        };
      }
      
      // Проверяем, что это изображение
      if (!mimeType.startsWith('image/')) {
        return {
          isValid: false,
          error: 'Выбранный файл не является изображением',
          suggestedFormats: getSupportedFormatsString(),
        };
      }
      
      // Извлекаем формат из MIME-типа и проверяем поддержку
      const format = mimeType.replace('image/', '');
      const extension = format === 'jpeg' ? 'jpg' : format;
      
      if (!isSupportedFormat(extension)) {
        return {
          isValid: false,
          error: `Формат .${extension.toUpperCase()} не поддерживается`,
          suggestedFormats: getSupportedFormatsString(),
        };
      }
      
      // Data URL валиден
      return {
        isValid: true,
      };
    }

    // Обычный URI - проверяем расширение файла
    const extension = getFileExtension(uri);
    
    // Проверяем, что расширение есть
    if (!extension) {
      return {
        isValid: false,
        error: 'Не удалось определить формат файла',
        suggestedFormats: getSupportedFormatsString(),
      };
    }

    // Проверяем, поддерживается ли формат
    if (!isSupportedFormat(extension)) {
      return {
        isValid: false,
        error: `Формат .${extension.toUpperCase()} не поддерживается`,
        suggestedFormats: getSupportedFormatsString(),
      };
    }

    // Всё в порядке
    return {
      isValid: true,
    };
  } catch (error) {
    logger.error('Ошибка валидации изображения:', error);
    return {
      isValid: false,
      error: 'Ошибка при проверке файла',
    };
  }
}

/**
 * Валидация изображения с выбросом ошибки
 * Для использования в async/await цепочках
 */
export function validateImageOrThrow(uri: string): void {
  const result = validateImage(uri);
  
  if (!result.isValid) {
    let errorMessage = result.error || 'Неподдерживаемый формат файла';
    
    if (result.suggestedFormats) {
      errorMessage += `\n\nПоддерживаемые форматы:\n${result.suggestedFormats}`;
    }
    
    throw new Error(errorMessage);
  }
}

