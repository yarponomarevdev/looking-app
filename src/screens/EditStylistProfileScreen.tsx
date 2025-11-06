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
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useStylistStore } from '../store/stylistStore';
import { MOSCOW_MALLS, POPULAR_BRANDS } from '../constants/malls';
import { Stylist, WorkSchedule, SocialLinks } from '../types';

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
  const { fetchStylistByUserId, updateStylist, updateStatus } = useStylistStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Основная информация
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState<'available' | 'busy' | 'offline'>('available');
  
  // Социальные сети
  const [instagram, setInstagram] = useState('');
  const [vk, setVk] = useState('');
  const [telegram, setTelegram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  
  // Торговые центры
  const [selectedMalls, setSelectedMalls] = useState<string[]>([]);
  
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
    const stylist = await fetchStylistByUserId(user.id);
    
    if (stylist) {
      setBio(stylist.bio || '');
      setStatus(stylist.status);
      setSelectedMalls(stylist.malls || []);
      setSelectedBrands(stylist.brands || []);
      setWorkSchedule(stylist.work_schedule || workSchedule);
      
      // Загружаем социальные сети
      if (stylist.social_links) {
        setInstagram(stylist.social_links.instagram || '');
        setVk(stylist.social_links.vk || '');
        setTelegram(stylist.social_links.telegram || '');
        setWhatsapp(stylist.social_links.whatsapp || '');
      }
    }
    
    setLoading(false);
  };

  const toggleMall = (mall: string) => {
    if (selectedMalls.includes(mall)) {
      setSelectedMalls(selectedMalls.filter(m => m !== mall));
    } else {
      setSelectedMalls([...selectedMalls, mall]);
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
    
    // Валидация
    if (selectedMalls.length === 0) {
      Alert.alert('Ошибка', 'Выберите хотя бы один торговый центр');
      return;
    }

    setSaving(true);

    const social_links: SocialLinks = {};
    if (instagram) social_links.instagram = instagram;
    if (vk) social_links.vk = vk;
    if (telegram) social_links.telegram = telegram;
    if (whatsapp) social_links.whatsapp = whatsapp;

    const updates: Partial<Stylist> = {
      bio,
      status,
      malls: selectedMalls,
      brands: selectedBrands,
      social_links,
      work_schedule: workSchedule,
    };

    const success = await updateStylist(user.id, updates);
    
    setSaving(false);

    if (success) {
      Alert.alert('Успешно', 'Профиль обновлен', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert('Ошибка', 'Не удалось обновить профиль');
    }
  };

  const handleStatusChange = async (newStatus: 'available' | 'busy' | 'offline') => {
    if (!user) return;
    setStatus(newStatus);
    await updateStatus(user.id, newStatus);
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
      {/* Статус */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Текущий статус</Text>
        <View style={styles.statusButtons}>
          <TouchableOpacity
            style={[styles.statusButton, status === 'available' && styles.statusButtonActive]}
            onPress={() => handleStatusChange('available')}
          >
            <Text style={[styles.statusButtonText, status === 'available' && styles.statusButtonTextActive]}>
              ✅ Свободен
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusButton, status === 'busy' && styles.statusButtonActive]}
            onPress={() => handleStatusChange('busy')}
          >
            <Text style={[styles.statusButtonText, status === 'busy' && styles.statusButtonTextActive]}>
              ⏳ Занят
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusButton, status === 'offline' && styles.statusButtonActive]}
            onPress={() => handleStatusChange('offline')}
          >
            <Text style={[styles.statusButtonText, status === 'offline' && styles.statusButtonTextActive]}>
              ⛔ Офлайн
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Информация о себе */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>О себе</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Расскажите о себе и своем опыте работы стилистом..."
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
          value={instagram}
          onChangeText={setInstagram}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="VK (ссылка или username)"
          value={vk}
          onChangeText={setVk}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Telegram (с @)"
          value={telegram}
          onChangeText={setTelegram}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="WhatsApp (номер телефона)"
          value={whatsapp}
          onChangeText={setWhatsapp}
          keyboardType="phone-pad"
        />
      </View>

      {/* Торговые центры */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Торговые центры</Text>
        <Text style={styles.hint}>Выберите ТЦ, в которых вы работаете</Text>
        <View style={styles.tagContainer}>
          {MOSCOW_MALLS.map((mall) => (
            <TouchableOpacity
              key={mall}
              style={[styles.tag, selectedMalls.includes(mall) && styles.tagSelected]}
              onPress={() => toggleMall(mall)}
            >
              <Text style={[styles.tagText, selectedMalls.includes(mall) && styles.tagTextSelected]}>
                {mall}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
                  value={workSchedule[key].start}
                  onChangeText={(value) => updateDaySchedule(key, 'start', value)}
                />
                <Text style={styles.timeSeparator}>—</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="20:00"
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
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  statusButtonActive: {
    borderColor: '#6200ee',
    backgroundColor: '#6200ee',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  statusButtonTextActive: {
    color: 'white',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
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
    gap: 8,
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
  },
  customBrandContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  customBrandInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#6200ee',
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  scheduleRow: {
    marginBottom: 16,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
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

