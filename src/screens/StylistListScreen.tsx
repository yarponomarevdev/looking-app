/**
 * Экран со списком всех активных стилистов
 * Альтернативный способ просмотра стилистов (кроме карты)
 */

import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Image, Text, ActivityIndicator } from 'react-native';
import { useStylistStore } from '../store/stylistStore';
import { Stylist } from '../types';

export default function StylistListScreen({ navigation }: any) {
  const { stylists, loading, fetchStylists } = useStylistStore();

  useEffect(() => {
    fetchStylists();
  }, []);

  const renderStylist = ({ item }: { item: Stylist }) => {
    const statusColor = item.status === 'available' ? '#4CAF50' : '#FFA726';
    const statusText = item.status === 'available' ? 'Свободен' : 'Занят';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('StylistDetail', { id: item.id })}
      >
        {item.avatar_url && (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        )}
        <View style={styles.info}>
          <Text style={styles.name}>{item.full_name}</Text>
          <Text style={styles.mall}>{item.current_mall}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>⭐ {item.rating.toFixed(1)}</Text>
            <Text style={[styles.status, { color: statusColor }]}>{statusText}</Text>
          </View>
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
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

