/**
 * Провайдер для кросс-платформенных алертов и уведомлений
 * Поддерживает веб и мобильные платформы
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, Animated } from 'react-native';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

interface ToastOptions {
  message: string;
  duration?: number;
  type?: 'success' | 'error' | 'info';
}

interface AlertContextValue {
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
  showToast: (options: ToastOptions) => void;
}

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertOptions, setAlertOptions] = useState<AlertOptions>({ title: '', message: '' });
  
  const [toasts, setToasts] = useState<Array<ToastOptions & { id: number }>>([]);
  const [nextToastId, setNextToastId] = useState(0);

  const showAlert = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
    setAlertOptions({
      title,
      message,
      buttons: buttons || [{ text: 'OK', style: 'default' }],
    });
    setAlertVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setAlertVisible(false);
  }, []);

  const handleButtonPress = useCallback((button: AlertButton) => {
    button.onPress?.();
    hideAlert();
  }, [hideAlert]);

  const showToast = useCallback((options: ToastOptions) => {
    const id = nextToastId;
    setNextToastId(id + 1);
    
    const toast = {
      ...options,
      id,
      duration: options.duration || 3000,
    };
    
    setToasts(prev => [...prev, toast]);
    
    // Автоматически удаляем toast через указанное время
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration);
  }, [nextToastId]);

  return (
    <AlertContext.Provider value={{ showAlert, showToast }}>
      {children}
      
      {/* Alert Modal */}
      <Modal
        visible={alertVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={hideAlert}
        statusBarTranslucent={true}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>{alertOptions.title}</Text>
            {alertOptions.message && (
              <Text style={styles.alertMessage}>{alertOptions.message}</Text>
            )}
            <View style={styles.alertButtons}>
              {alertOptions.buttons?.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.alertButton,
                    button.style === 'cancel' && styles.alertButtonCancel,
                    button.style === 'destructive' && styles.alertButtonDestructive,
                  ]}
                  onPress={() => handleButtonPress(button)}
                >
                  <Text
                    style={[
                      styles.alertButtonText,
                      button.style === 'cancel' && styles.alertButtonTextCancel,
                      button.style === 'destructive' && styles.alertButtonTextDestructive,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast Container */}
      {toasts.length > 0 && (
        <View style={styles.toastContainer}>
          {toasts.map(toast => (
            <ToastItem
              key={toast.id}
              message={toast.message}
              type={toast.type || 'info'}
              onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            />
          ))}
        </View>
      )}
    </AlertContext.Provider>
  );
}

function ToastItem({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  const opacity = useState(new Animated.Value(0))[0];

  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return styles.toastSuccess;
      case 'error':
        return styles.toastError;
      default:
        return styles.toastInfo;
    }
  };

  const getToastIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      default:
        return 'ℹ';
    }
  };

  return (
    <Animated.View style={[styles.toast, getToastStyle(), { opacity }]}>
      <Text style={styles.toastIcon}>{getToastIcon()}</Text>
      <Text style={styles.toastMessage}>{message}</Text>
      <TouchableOpacity onPress={onClose} style={styles.toastCloseButton}>
        <Text style={styles.toastCloseText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  // Alert styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 10000, // Показываем Alert поверх всех модальных окон
    ...(Platform.OS === 'web' && {
      position: 'fixed' as any,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    }),
  },
  alertBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    minWidth: Platform.OS === 'web' ? 300 : '100%',
    maxWidth: 400,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    }),
    elevation: 10, // Увеличиваем elevation для Android
    zIndex: 10001, // Добавляем zIndex для веб
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  alertMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  alertButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  alertButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#6200ee',
    minWidth: 80,
    alignItems: 'center',
    marginLeft: 12,
  },
  alertButtonCancel: {
    backgroundColor: '#e0e0e0',
  },
  alertButtonDestructive: {
    backgroundColor: '#d32f2f',
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  alertButtonTextCancel: {
    color: '#333',
  },
  alertButtonTextDestructive: {
    color: 'white',
  },

  // Toast styles
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    minWidth: Platform.OS === 'web' ? 320 : '90%',
    maxWidth: Platform.OS === 'web' ? 500 : '90%',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    }),
    elevation: 5,
  },
  toastSuccess: {
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  toastError: {
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  toastInfo: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  toastIcon: {
    fontSize: 20,
    marginRight: 12,
    fontWeight: 'bold',
  },
  toastMessage: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  toastCloseButton: {
    marginLeft: 12,
    padding: 4,
  },
  toastCloseText: {
    fontSize: 18,
    color: '#999',
  },
});

