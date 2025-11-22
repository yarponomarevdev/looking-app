/**
 * Экран редактирования профиля стилиста
 * Позволяет стилисту обновлять всю информацию о себе
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../store/authStore';
import { useStylistStore } from '../store/stylistStore';
import { MOSCOW_MALLS, POPULAR_BRANDS } from '../constants/malls';
import { Stylist, WorkSchedule, SocialLinks } from '../types';
import { supabase } from '../lib/supabase';
import { useAlert } from '../components/alert/AlertProvider';

const DAYS_OF_WEEK = [
  { key: 'monday' as keyof WorkSchedule, label: 'Понедельник' },
  { key: 'tuesday' as keyof WorkSchedule, label: 'Вторник' },
  { key: 'wednesday' as keyof WorkSchedule, label: 'Среда' },
  { key: 'thursday' as keyof WorkSchedule, label: 'Четверг' },
  { key: 'friday' as keyof WorkSchedule, label: 'Пятница' },
  { key: 'saturday' as keyof WorkSchedule, label: 'Суббота' },
  { key: 'sunday' as keyof WorkSchedule, label: 'Воскресенье' },
];

export default function EditStylistProfileScreen({ navigation, route }: any) {
  const { user } = useAuthStore();
  const { fetchStylistByUserId, updateStylist, fetchStylists } = useStylistStore();
  const { showAlert } = useAlert();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Основная информация
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  
  // Социальные сети
  const [instagram, setInstagram] = useState('');
  const [vk, setVk] = useState('');
  const [telegram, setTelegram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  
  // Бренды
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [customBrand, setCustomBrand] = useState('');
  
  // График работы
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule>({
    monday: { enabled: true, start: '10:00', end: '20:00' },
    tuesday: { enabled: true, start: '10:00', end: '20:00' },
    wednesday: { enabled: true, start: '10:00', end: '20:00' },
    thursday: { enabled: true, start: '10:00', end: '20:00' },
    friday: { enabled: true, start: '10:00', end: '20:00' },
    saturday: { enabled: true, start: '11:00', end: '19:00' },
    sunday: { enabled: false, start: '10:00', end: '20:00' },
  });

  useEffect(() => {
    loadStylistData();
  }, [user]);

  const loadStylistData = async () => {
    if (!user) return;
    
    setLoading(true);
    // Принудительно загружаем свежие данные из БД, игнорируя кэш
    const stylist = await fetchStylistByUserId(user.id, true);
    
    if (stylist) {
      setAvatarUrl(stylist.avatar_url || user.user_metadata?.avatar_url || null);
      setBio(stylist.bio || '');
      setSelectedBrands(stylist.brands || []);
      setWorkSchedule(stylist.work_schedule || workSchedule);
      
      // Загружаем социальные сети
      if (stylist.social_links) {
        setInstagram(stylist.social_links.instagram || '');
        setVk(stylist.social_links.vk || '');
        setTelegram(stylist.social_links.telegram || '');
        setWhatsapp(stylist.social_links.whatsapp || '');
      }
    } else {
      // Также можно установить аватар по умолчанию из профиля auth
      setAvatarUrl(user.user_metadata?.avatar_url || null);
    }
    
    setLoading(false);
  };

  /**
   * Выбор изображения из галереи
   */
  const pickImage = async () => {
    // Запрашиваем разрешение на доступ к галерее
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      showAlert('Ошибка', 'Необходимо разрешение на доступ к галерее');
      return;
    }

    // Открываем выбор изображения
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  /**
   * Загрузка аватара в Supabase Storage
   */
  const uploadAvatar = async (uri: string) => {
    if (!user) return;

    try {
      setUploading(true);

      // Получаем расширение файла
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Читаем файл как ArrayBuffer для Supabase
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      // Загружаем в Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Получаем публичный URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Обновляем метаданные пользователя
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      if (updateError) {
        throw updateError;
      }

      // Обновляем таблицу profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (profileError) {
        console.error('Ошибка обновления profiles:', profileError);
      }

      setAvatarUrl(publicUrl);
      
      // Перезагружаем данные стилистов для обновления кеша
      await fetchStylists();
      
      showAlert('Успешно', 'Аватар обновлен');
    } catch (error: any) {
      showAlert('Ошибка', error.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleBrand = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter(b => b !== brand));
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
  };

  const addCustomBrand = () => {
    if (customBrand.trim() && !selectedBrands.includes(customBrand.trim())) {
      setSelectedBrands([...selectedBrands, customBrand.trim()]);
      setCustomBrand('');
    }
  };

  const removeBrand = (brand: string) => {
    setSelectedBrands(selectedBrands.filter(b => b !== brand));
  };

  const updateDaySchedule = (day: keyof WorkSchedule, field: 'enabled' | 'start' | 'end', value: any) => {
    setWorkSchedule({
      ...workSchedule,
      [day]: {
        ...workSchedule[day],
        [field]: value,
      },
    });
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    const social_links: SocialLinks = {};
    if (instagram) social_links.instagram = instagram;
    if (vk) social_links.vk = vk;
    if (telegram) social_links.telegram = telegram;
    if (whatsapp) social_links.whatsapp = whatsapp;

    const updates: Partial<Stylist> = {
      bio,
      brands: selectedBrands,
      social_links,
      work_schedule: workSchedule,
    };

    const success = await updateStylist(user.id, updates);
    
    setSaving(false);

    if (success) {
      showAlert('Успешно', 'Профиль обновлен', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } else {
      showAlert('Ошибка', 'Не удалось обновить профиль');
    }
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Аватар */}
      <View style={styles.avatarSection}>
        <Text style={styles.avatarSectionTitle}>Фото профиля</Text>
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={pickImage}
          disabled={uploading}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || 'С'}
              </Text>
            </View>
          )}
          
          {uploading ? (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator color="white" size="large" />
            </View>
          ) : (
            <View style={styles.editBadge}>
              <Text style={styles.editBadgeText}>✏️</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Нажмите на фото, чтобы изменить</Text>
      </View>

      {/* Информация о себе */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>О себе</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Расскажите о себе и своем опыте работы стилистом..."
          placeholderTextColor="#999"
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      {/* Социальные сети */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Социальные сети</Text>
        <TextInput
          style={styles.input}
          placeholder="Instagram (без @)"
          placeholderTextColor="#999"
          value={instagram}
          onChangeText={setInstagram}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="VK (ссылка или username)"
          placeholderTextColor="#999"
          value={vk}
          onChangeText={setVk}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Telegram (с @)"
          placeholderTextColor="#999"
          value={telegram}
          onChangeText={setTelegram}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="WhatsApp (номер телефона)"
          placeholderTextColor="#999"
          value={whatsapp}
          onChangeText={setWhatsapp}
          keyboardType="phone-pad"
        />
      </View>

      {/* Бренды */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Бренды одежды</Text>
        <Text style={styles.hint}>Выберите бренды, с которыми вы работаете</Text>
        
        {/* Выбранные бренды */}
        {selectedBrands.length > 0 && (
          <View style={styles.selectedTagsContainer}>
            <Text style={styles.selectedTagsLabel}>Выбрано ({selectedBrands.length}):</Text>
            <View style={styles.tagContainer}>
              {selectedBrands.map((brand) => (
                <TouchableOpacity
                  key={brand}
                  style={styles.selectedTag}
                  onPress={() => removeBrand(brand)}
                >
                  <Text style={styles.selectedTagText}>{brand}</Text>
                  <Text style={styles.selectedTagRemove}>✕</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Популярные бренды */}
        <View style={styles.tagContainer}>
          {POPULAR_BRANDS.map((brand) => (
            <TouchableOpacity
              key={brand}
              style={[styles.tag, selectedBrands.includes(brand) && styles.tagSelected]}
              onPress={() => toggleBrand(brand)}
            >
              <Text style={[styles.tagText, selectedBrands.includes(brand) && styles.tagTextSelected]}>
                {brand}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Добавить свой бренд */}
        <View style={styles.customBrandContainer}>
          <TextInput
            style={styles.customBrandInput}
            placeholder="Добавить свой бренд"
            placeholderTextColor="#999"
            value={customBrand}
            onChangeText={setCustomBrand}
          />
          <TouchableOpacity style={styles.addButton} onPress={addCustomBrand}>
            <Text style={styles.addButtonText}>Добавить</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* График работы */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>График работы</Text>
        <Text style={styles.hint}>Укажите дни и часы, когда вы доступны для встреч</Text>
        {DAYS_OF_WEEK.map(({ key, label }) => (
          <View key={key} style={styles.scheduleRow}>
            <View style={styles.scheduleHeader}>
              <Text style={styles.dayLabel}>{label}</Text>
              <Switch
                value={workSchedule[key].enabled}
                onValueChange={(value) => updateDaySchedule(key, 'enabled', value)}
                trackColor={{ false: '#ccc', true: '#6200ee' }}
              />
            </View>
            {workSchedule[key].enabled && (
              <View style={styles.timeRow}>
                <TextInput
                  style={styles.timeInput}
                  placeholder="10:00"
                  placeholderTextColor="#999"
                  value={workSchedule[key].start}
                  onChangeText={(value) => updateDaySchedule(key, 'start', value)}
                />
                <Text style={styles.timeSeparator}>—</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="20:00"
                  placeholderTextColor="#999"
                  value={workSchedule[key].end}
                  onChangeText={(value) => updateDaySchedule(key, 'end', value)}
                />
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Кнопка сохранения */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.saveButtonText}>Сохранить изменения</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  avatarSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 56,
    color: 'white',
    fontWeight: 'bold',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6200ee',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  editBadgeText: {
    fontSize: 16,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  hint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginVertical: -4,
  },
  tag: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
    margin: 4,
  },
  tagSelected: {
    backgroundColor: '#6200ee',
    borderColor: '#6200ee',
  },
  tagText: {
    fontSize: 14,
    color: '#666',
  },
  tagTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  selectedTagsContainer: {
    marginBottom: 16,
  },
  selectedTagsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#6200ee',
  },
  selectedTagText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  selectedTagRemove: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  customBrandContainer: {
    flexDirection: 'column',
    marginTop: 12,
    alignItems: 'stretch',
  },
  customBrandInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#6200ee',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginTop: 8,
    alignSelf: 'stretch',
    alignItems: 'center',
    minWidth: 100,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  scheduleRow: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 16,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    maxWidth: '45%',
  },
  timeSeparator: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  saveButton: {
    backgroundColor: '#6200ee',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

