/**
 * Экран авторизации
 * Содержит табы для входа и регистрации
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'client' | 'stylist'>('client');
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();
  const { signIn, signUp, user } = useAuthStore();
  const { showAlert } = useAlert();

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

      if (!isLogin && !fullName) {
        showAlert('Ошибка', 'Введите ваше имя');
        return;
      }
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
        await signUp(email, password, fullName, role);
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
    >
      <View style={styles.content}>
        <Text style={styles.title}>Looking</Text>
        <Text style={styles.subtitle}>Найди своего стилиста</Text>

        {/* Табы */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, isLogin && styles.activeTab]}
            onPress={() => setIsLogin(true)}
          >
            <Text style={[styles.tabText, isLogin && styles.activeTabText]}>Вход</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, !isLogin && styles.activeTab]}
            onPress={() => setIsLogin(false)}
          >
            <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>Регистрация</Text>
          </TouchableOpacity>
        </View>

        {/* Поля формы */}
        <View style={styles.form}>
          {!isLogin && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Ваше имя"
                placeholderTextColor="#999"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
              
              {/* Выбор роли */}
              <View style={styles.roleContainer}>
                <Text style={styles.roleLabel}>Я хочу быть:</Text>
                <View style={styles.roleButtons}>
                  <TouchableOpacity
                    style={[styles.roleButton, role === 'client' && styles.roleButtonActive]}
                    onPress={() => setRole('client')}
                  >
                    <Text style={[styles.roleButtonText, role === 'client' && styles.roleButtonTextActive]}>
                      Клиентом
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleButton, role === 'stylist' && styles.roleButtonActive]}
                    onPress={() => setRole('stylist')}
                  >
                    <Text style={[styles.roleButtonText, role === 'stylist' && styles.roleButtonTextActive]}>
                      Стилистом
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
          <TextInput
            style={styles.input}
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
            style={styles.input}
            placeholder="Пароль"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onSubmitEditing={handleAuth}
            returnKeyType="done"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#6200ee',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 8,
    overflow: 'hidden',
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
  },
  button: {
    backgroundColor: '#6200ee',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      userSelect: 'none' as any,
    }),
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
  roleContainer: {
    marginBottom: 8,
  },
  roleLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  roleButtons: {
    flexDirection: 'row',
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6200ee',
    backgroundColor: 'white',
    alignItems: 'center',
    marginLeft: 12,
  },
  roleButtonActive: {
    backgroundColor: '#6200ee',
  },
  roleButtonText: {
    fontSize: 16,
    color: '#6200ee',
    fontWeight: '500',
  },
  roleButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
});

