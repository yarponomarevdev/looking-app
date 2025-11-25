/**
 * Экран авторизации
 * Содержит табы для входа и регистрации
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuthStore } from '../store/authStore';
import { useAlert } from '../components/alert/AlertProvider';
import { z } from 'zod';

// Схемы валидации
const AuthSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
});

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'client' | 'stylist'>('client');
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();
  const { signIn, signUp, user } = useAuthStore();
  const { showAlert } = useAlert();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  
  // Определяем, является ли экран маленьким (меньше 700px по высоте)
  const isSmallScreen = screenHeight < 700;

  // Закрываем модальное окно после успешного входа
  useEffect(() => {
    if (user) {
      navigation.goBack();
    }
  }, [user, navigation]);

  const handleAuth = async () => {
    try {
      // Валидация
      AuthSchema.parse({ email, password });
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        showAlert('Ошибка', e.errors[0].message);
      }
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        console.log('Attempting sign in...');
        await signIn(email, password);
        console.log('Sign in successful');
        // Модальное окно закроется автоматически через useEffect при изменении user
      } else {
        console.log('Attempting sign up...');
        await signUp(email, password, role);
        showAlert('Успех', 'Проверьте email для подтверждения регистрации');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      // Улучшаем сообщение об ошибке
      const errorMessage = error.message === 'Invalid login credentials' 
        ? 'Неверный email или пароль' 
        : error.message || 'Что-то пошло не так';
      showAlert('Ошибка', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Кнопка закрытия */}
      <TouchableOpacity
        style={[
          styles.closeButton,
          isSmallScreen && styles.closeButtonSmall
        ]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons 
          name="close" 
          size={isSmallScreen ? 24 : 28} 
          color="#666" 
        />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isSmallScreen && styles.scrollContentSmall
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={[
            styles.title,
            isSmallScreen && styles.titleSmall
          ]}>
            Looking
          </Text>
          <Text style={[
            styles.subtitle,
            isSmallScreen && styles.subtitleSmall
          ]}>
            Найди своего стилиста
          </Text>

        {/* Табы */}
        <View style={[
          styles.tabContainer,
          isSmallScreen && styles.tabContainerSmall
        ]}>
          <TouchableOpacity
            style={[styles.tab, isLogin && styles.activeTab]}
            onPress={() => setIsLogin(true)}
          >
            <Text style={[
              styles.tabText,
              isLogin && styles.activeTabText,
              isSmallScreen && styles.tabTextSmall
            ]}>
              Вход
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, !isLogin && styles.activeTab]}
            onPress={() => setIsLogin(false)}
          >
            <Text style={[
              styles.tabText,
              !isLogin && styles.activeTabText,
              isSmallScreen && styles.tabTextSmall
            ]}>
              Регистрация
            </Text>
          </TouchableOpacity>
        </View>

        {/* Поля формы */}
        <View style={styles.form}>
          <TextInput
            style={[
              styles.input,
              isSmallScreen && styles.inputSmall
            ]}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            onSubmitEditing={() => {
              // Переходим к полю пароля при нажатии Enter
              if (password) {
                handleAuth();
              }
            }}
            returnKeyType="next"
          />
          <TextInput
            style={[
              styles.input,
              isSmallScreen && styles.inputSmall
            ]}
            placeholder="Пароль"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onSubmitEditing={handleAuth}
            returnKeyType="done"
          />

          {!isLogin && (
            <>
              {/* Выбор роли */}
              <View style={styles.roleContainer}>
                <View style={[
                  styles.roleButtons,
                  isSmallScreen && styles.roleButtonsSmall
                ]}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === 'client' && styles.roleButtonActive,
                      isSmallScreen && styles.roleButtonSmall
                    ]}
                    onPress={() => setRole('client')}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      role === 'client' && styles.roleButtonTextActive,
                      isSmallScreen && styles.roleButtonTextSmall
                    ]}>
                      Ищу образ
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === 'stylist' && styles.roleButtonActive,
                      isSmallScreen && styles.roleButtonSmall
                    ]}
                    onPress={() => setRole('stylist')}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      role === 'stylist' && styles.roleButtonTextActive,
                      isSmallScreen && styles.roleButtonTextSmall
                    ]}>
                      Создаю образы
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              loading && styles.buttonDisabled,
              isSmallScreen && styles.buttonSmall
            ]}
            onPress={handleAuth}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.buttonText,
              isSmallScreen && styles.buttonTextSmall
            ]}>
              {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButtonSmall: {
    top: Platform.OS === 'ios' ? 40 : 15,
    right: 15,
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },
  scrollContentSmall: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 16,
  },
  content: {
    width: '100%',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#6200ee',
    marginBottom: 8,
  },
  titleSmall: {
    fontSize: 36,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  subtitleSmall: {
    fontSize: 16,
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tabContainerSmall: {
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  activeTab: {
    backgroundColor: '#6200ee',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  tabTextSmall: {
    fontSize: 14,
  },
  activeTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  form: {
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
    minHeight: 50,
  },
  inputSmall: {
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
    minHeight: 48,
  },
  button: {
    backgroundColor: '#6200ee',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 50,
    justifyContent: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      userSelect: 'none' as any,
    }),
  },
  buttonSmall: {
    padding: 14,
    minHeight: 48,
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
    ...(Platform.OS === 'web' && {
      cursor: 'not-allowed' as any,
    }),
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonTextSmall: {
    fontSize: 16,
  },
  roleContainer: {
    marginBottom: 8,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButtonsSmall: {
    gap: 8,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6200ee',
    backgroundColor: 'white',
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  roleButtonSmall: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    minHeight: 44,
  },
  roleButtonActive: {
    backgroundColor: '#6200ee',
  },
  roleButtonText: {
    fontSize: 15,
    color: '#6200ee',
    fontWeight: '500',
    textAlign: 'center',
  },
  roleButtonTextSmall: {
    fontSize: 13,
  },
  roleButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
});

