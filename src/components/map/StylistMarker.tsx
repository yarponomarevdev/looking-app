/**
 * Компонент маркера стилиста на карте
 * Отображает информацию при клике на маркер в виде Callout
 */

import React from 'react';
import { Marker, Callout } from 'react-native-maps';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Stylist } from '../../types';

interface StylistMarkerProps {
  stylist: Stylist;
  onPress: (stylist: Stylist) => void;
}

export default function StylistMarker({ stylist, onPress }: StylistMarkerProps) {
  const pinColor = stylist.status === 'available' ? '#4CAF50' : '#FFA726';
  
  return (
    <Marker
      coordinate={{ latitude: stylist.latitude, longitude: stylist.longitude }}
      pinColor={pinColor}
      onCalloutPress={() => onPress(stylist)}
    >
      <Callout tooltip>
        <View style={styles.callout}>
          {stylist.avatar_url && (
            <Image 
              source={{ uri: stylist.avatar_url }} 
              style={styles.avatar} 
            />
          )}
          <Text style={styles.name}>{stylist.full_name}</Text>
          <Text style={styles.mall}>{stylist.current_mall}</Text>
          <Text style={[styles.status, { color: pinColor }]}>
            {stylist.status === 'available' ? 'Свободен' : 'Занят'}
          </Text>
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  callout: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    minWidth: 150,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    marginBottom: 8 
  },
  name: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 4 
  },
  mall: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 4 
  },
  status: { 
    fontSize: 12, 
    fontWeight: '600' 
  },
});

