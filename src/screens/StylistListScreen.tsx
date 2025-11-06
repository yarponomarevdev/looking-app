/**
 * Экран со списком всех активных стилистов
 * Альтернативный способ просмотра стилистов (кроме карты)
 */

import React, { useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Image, Text, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useStylistStore } from '../store/stylistStore';
import { Stylist } from '../types';

export default function StylistListScreen({ navigation }: any) {
  const { stylists, loading, fetchStylists } = useStylistStore();

  // Перезагружаем данные при фокусе на экран
  useFocusEffect(
    useCallback(() => {
      fetchStylists();
    }, [])
  );

  useEffect(() => {
    fetchStylists();
  }, []);

  const renderStylist = ({ item }: { item: Stylist }) => {
    const statusColor = item.status === 'active' ? '#4CAF50' : '#999';
    const statusText = item.status === 'active' ? 'Активен' : 'Не активен';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('StylistDetail', { id: item.id })}
      >
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>
              {item.full_name?.charAt(0).toUpperCase() || 'С'}
            </Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name}>{item.full_name}</Text>
          {item.malls && item.malls.length > 0 && (
            <Text style={styles.mall} numberOfLines={1}>
              {item.malls.length === 1 
                ? item.malls[0] 
                : `${item.malls[0]} и еще ${item.malls.length - 1}`}
            </Text>
          )}
          <Text style={[styles.status, { color: statusColor }]}>{statusText}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && stylists.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={stylists}
        renderItem={renderStylist}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarPlaceholderText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mall: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

