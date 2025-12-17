/**
 * Экран создания нового образа стилиста
 * Позволяет загрузить фото, указать название, описание, бренды и цену
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useStylistStore } from '../store/stylistStore';
import { useLookStore } from '../store/lookStore';
import { supabase } from '../lib/supabase';
import { POPULAR_BRANDS } from '../constants/malls';
import { prepareImageForUpload, generateFileName, validateImage, convertImageIfNeeded, getFileExtension, shouldConvertFormat } from '../utils/imageUtils';
import { launchImageLibraryWithWebSupport, requestMediaLibraryPermissions } from '../utils/imagePickerWeb';
import { useAlert } from '../components/alert/AlertProvider';

export default function CreateLookScreen({ navigation, route }: any) {
  const { user } = useAuthStore();
  const { fetchStylistByUserId } = useStylistStore();
  const { createLook, fetchLooks } = useLookStore();
  const { showAlert } = useAlert();

  // Получаем бренды из профиля стилиста (переданные через navigation params)
  const profileBrands = route.params?.profileBrands || [];

  const [uploading, setUploading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [conversionMessage, setConversionMessage] = useState('');
  const [stylistId, setStylistId] = useState<string | null>(null);
  
  // Поля образа
  const [lookTitle, setLookTitle] = useState('');
  const [lookDescription, setLookDescription] = useState('');
  const [lookImage, setLookImage] = useState<string | null>(null);
  const [lookBrands, setLookBrands] = useState<string[]>(profileBrands);
  const [lookPrice, setLookPrice] = useState('');
  const [customBrand, setCustomBrand] = useState('');

  useEffect(() => {
    loadStylistData();
  }, [user]);

  const loadStylistData = async () => {
    if (!user) return;
    const stylist = await fetchStylistByUserId(user.id);
    if (stylist) {
      setStylistId(stylist.id);
    }
  };

  /**
   * Выбор изображения из галереи
   */
  const pickLookImage = async () => {
    try {
      const { status } = await requestMediaLibraryPermissions();
      
      if (status !== 'granted') {
        showAlert('Ошибка', 'Необходимо разрешение на доступ к галерее');
        return;
      }

      const result = await launchImageLibraryWithWebSupport({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedUri = result.assets[0].uri;
        
        console.log('Выбрано изображение:', {
          uri: selectedUri.substring(0, 100) + '...',
          fileName: result.assets[0].fileName,
          mimeType: result.assets[0].mimeType,
        });
        
        // Валидация формата изображения
        const validation = validateImage(selectedUri);
        
        console.log('Результат валидации:', validation);
        
        if (!validation.isValid) {
          let errorMessage = validation.error || 'Неподдерживаемый формат файла';
          
          if (validation.suggestedFormats) {
            errorMessage += `\n\nПоддерживаемые форматы:\n${validation.suggestedFormats}`;
          }
          
          console.warn('Валидация не пройдена:', errorMessage);
          showAlert('Неподдерживаемый формат', errorMessage);
          return;
        }
        
        console.log('Валидация пройдена, проверяем необходимость конвертации');
        
        // Проверяем, нужна ли конвертация
        const fileExtension = getFileExtension(selectedUri);
        const needsConversion = shouldConvertFormat(fileExtension);
        
        if (needsConversion) {
          // Конвертируем сразу после выбора
          setConverting(true);
          setConversionMessage(`Конвертация ${fileExtension.toUpperCase()} в JPEG...`);
          
          try {
            const { uri: convertedUri } = await convertImageIfNeeded(selectedUri, undefined, undefined, 0.8);
            setLookImage(convertedUri);
            setConversionMessage('');
            setConverting(false);
            console.log('Изображение успешно сконвертировано');
          } catch (error: any) {
            console.error('Ошибка конвертации:', error);
            setConverting(false);
            setConversionMessage('');
            showAlert('Ошибка', 'Не удалось обработать изображение. Попробуйте другой файл.');
            return;
          }
        } else {
          setLookImage(selectedUri);
        }
      }
    } catch (error: any) {
      console.error('Ошибка при выборе изображения:', error);
      showAlert('Ошибка', error.message || 'Не удалось выбрать изображение');
    }
  };

  /**
   * Загрузка изображения образа в Supabase Storage
   * Поддерживает HEIC, JPEG, PNG, WebP и другие форматы
   */
  const uploadLookImage = async (uri: string): Promise<string | null> => {
    try {
      setConverting(true);
      
      // Подготавливаем изображение (конвертируем HEIC в JPEG если нужно)
      const { arrayBuffer, fileExtension, mimeType } = await prepareImageForUpload(uri, {
        quality: 0.8,
        onProgress: (message) => {
          setConversionMessage(message);
        },
      });

      setConversionMessage('Загрузка на сервер...');

      // Генерируем уникальное имя файла
      const fileName = generateFileName('look', fileExtension);
      const filePath = `${fileName}`;

      // Загружаем в Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('looks')
        .upload(filePath, arrayBuffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Получаем публичный URL
      const { data: urlData } = supabase.storage
        .from('looks')
        .getPublicUrl(filePath);

      setConverting(false);
      setConversionMessage('');

      return urlData.publicUrl;
    } catch (error: any) {
      setConverting(false);
      setConversionMessage('');
      showAlert('Ошибка', error.message);
      return null;
    }
  };

  /**
   * Переключение бренда
   */
  const toggleBrand = (brand: string) => {
    if (lookBrands.includes(brand)) {
      setLookBrands(lookBrands.filter(b => b !== brand));
    } else {
      setLookBrands([...lookBrands, brand]);
    }
  };

  /**
   * Добавление своего бренда
   */
  const addCustomBrand = () => {
    if (customBrand.trim() && !lookBrands.includes(customBrand.trim())) {
      setLookBrands([...lookBrands, customBrand.trim()]);
      setCustomBrand('');
    }
  };

  /**
   * Удаление бренда
   */
  const removeBrand = (brand: string) => {
    setLookBrands(lookBrands.filter(b => b !== brand));
  };

  /**
   * Создание образа
   */
  const handleCreateLook = async () => {
    if (!stylistId || !lookImage || !lookTitle.trim()) {
      showAlert('Ошибка', 'Заполните название и добавьте фото');
      return;
    }

    setUploading(true);

    const imageUrl = await uploadLookImage(lookImage);
    
    if (!imageUrl) {
      setUploading(false);
      return;
    }

    const price = lookPrice.trim() ? lookPrice.trim() : null;

    const success = await createLook(
      stylistId,
      lookTitle.trim(),
      lookDescription.trim(),
      imageUrl,
      lookBrands,
      price
    );

    setUploading(false);

    if (success) {
      await fetchLooks();
      showAlert('Успешно', 'Образ добавлен', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } else {
      showAlert('Ошибка', 'Не удалось создать образ');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Новый образ</Text>
          
          {/* Превью изображения */}
          <TouchableOpacity
            style={styles.imagePicker}
            onPress={pickLookImage}
            activeOpacity={0.8}
            disabled={converting}
          >
            {lookImage ? (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: lookImage }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View style={styles.imagePickerPlaceholder}>
                <Text style={styles.imagePickerText}>Добавить фото</Text>
                <Text style={styles.imagePickerHint}>Нажмите для выбора</Text>
              </View>
            )}
            {converting && (
              <View style={styles.convertingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.convertingText}>{conversionMessage || 'Обработка изображения...'}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          {/* Название */}
          <View style={styles.section}>
            <Text style={styles.label}>Название образа *</Text>
            <TextInput
              style={styles.input}
              placeholder="Например: Вечерний образ"
              placeholderTextColor="#999"
              value={lookTitle}
              onChangeText={setLookTitle}
              maxLength={100}
            />
          </View>
          
          {/* Описание */}
          <View style={styles.section}>
            <Text style={styles.label}>Описание</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Расскажите об образе..."
              placeholderTextColor="#999"
              value={lookDescription}
              onChangeText={setLookDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>
          
          {/* Бренды */}
          <View style={styles.section}>
            <Text style={styles.label}>Бренды</Text>
            {profileBrands.length > 0 && (
              <Text style={styles.hint}>
                Бренды автоматически подтянуты из вашего профиля
              </Text>
            )}
            
            {/* Выбранные бренды */}
            {lookBrands.length > 0 && (
              <View style={styles.selectedBrandsContainer}>
                {lookBrands.map((brand) => (
                  <TouchableOpacity
                    key={brand}
                    style={styles.selectedBrandTag}
                    onPress={() => removeBrand(brand)}
                  >
                    <Text style={styles.selectedBrandText}>{brand}</Text>
                    <Text style={styles.removeBrandIcon}>✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {/* Популярные бренды */}
            <View style={styles.brandTagsContainer}>
              {POPULAR_BRANDS.map((brand) => (
                <TouchableOpacity
                  key={brand}
                  style={[
                    styles.brandTag,
                    lookBrands.includes(brand) && styles.brandTagSelected
                  ]}
                  onPress={() => toggleBrand(brand)}
                >
                  <Text style={[
                    styles.brandTagText,
                    lookBrands.includes(brand) && styles.brandTagTextSelected
                  ]}>
                    {brand}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Добавить свой бренд */}
            <View style={styles.customBrandRow}>
              <TextInput
                style={styles.customBrandInput}
                placeholder="Добавить свой бренд"
                placeholderTextColor="#999"
                value={customBrand}
                onChangeText={setCustomBrand}
                maxLength={30}
                onSubmitEditing={addCustomBrand}
                returnKeyType="done"
              />
              <TouchableOpacity 
                style={styles.addBrandButton}
                onPress={addCustomBrand}
                disabled={!customBrand.trim()}
              >
                <Text style={styles.addBrandButtonText}>Добавить</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Цена */}
          <View style={styles.section}>
            <Text style={styles.label}>Стоимость (₽)</Text>
            <TextInput
              style={styles.input}
              placeholder="Например: 15000 или По запросу"
              placeholderTextColor="#999"
              value={lookPrice}
              onChangeText={setLookPrice}
            />
          </View>
          
          {/* Кнопки */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => navigation.goBack()}
              disabled={uploading}
            >
              <Text style={styles.cancelButtonText}>Отмена</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleCreateLook}
              disabled={uploading || converting}
            >
              {uploading || converting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.saveButtonText}>Создать образ</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  imagePicker: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    position: 'relative',
  },
  imagePreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  convertingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    zIndex: 10,
  },
  convertingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  imagePickerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  imagePickerHint: {
    fontSize: 14,
    color: '#999',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  selectedBrandsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    marginHorizontal: -4,
    marginVertical: -4,
  },
  selectedBrandTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#6200ee',
    margin: 4,
  },
  selectedBrandText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  removeBrandIcon: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  brandTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    marginHorizontal: -4,
    marginVertical: -4,
  },
  brandTag: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
    margin: 4,
  },
  brandTagSelected: {
    backgroundColor: '#e8d5ff',
    borderColor: '#6200ee',
  },
  brandTagText: {
    fontSize: 14,
    color: '#666',
  },
  brandTagTextSelected: {
    color: '#6200ee',
    fontWeight: '600',
  },
  customBrandRow: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  customBrandInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  addBrandButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#6200ee',
    marginTop: 8,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  addBrandButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#6200ee',
    marginLeft: 12,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

