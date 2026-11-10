import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Marker, Callout } from 'react-native-maps';

import { NyambagiPOI, UserLocation } from '@/types/location';
import { CATEGORY_METADATA } from '@/constants/nyambagi-poi';

interface CustomMapMarkerProps {
  poi: NyambagiPOI;
  isSelected: boolean;
  onPress: (poi: NyambagiPOI) => void;
}

export function CustomMapMarker({ poi, isSelected, onPress }: CustomMapMarkerProps) {
  const meta = CATEGORY_METADATA[poi.category];

  return (
    <Marker
      coordinate={poi.coordinates}
      onPress={() => onPress(poi)}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 1.0 }}
      calloutAnchor={{ x: 0.5, y: 0.0 }}>
      <View style={[styles.markerContainer, isSelected && styles.selectedMarkerContainer]}>
        <View style={[styles.pinBubble, { backgroundColor: meta.color }, isSelected && styles.selectedBubble]}>
          <Text style={styles.pinIconText}>
            {poi.category === 'posko_utama' && '🏛️'}
            {poi.category === 'makanan_siap_saji' && '🍲'}
            {poi.category === 'sembako' && '📦'}
            {poi.category === 'medis' && '💊'}
            {poi.category === 'pakaian' && '👕'}
          </Text>
        </View>
        <View style={[styles.pinArrow, { borderTopColor: meta.color }]} />
      </View>

      <Callout tooltip>
        <View style={styles.calloutCard}>
          <Text style={styles.calloutTitle}>{poi.name}</Text>
          <Text style={styles.calloutCategory}>{meta.label}</Text>
          <Text style={styles.calloutHint}>Ketuk untuk kalkulasi jarak Haversine</Text>
        </View>
      </Callout>
    </Marker>
  );
}

interface UserMapMarkerProps {
  location: UserLocation;
}

export function UserMapMarker({ location }: UserMapMarkerProps) {
  return (
    <Marker
      coordinate={{
        latitude: location.latitude,
        longitude: location.longitude,
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      flat={false}
      tracksViewChanges={false}>
      <View style={styles.userMarkerContainer}>
        <View style={styles.userPulseRing} />
        <View style={styles.userDot}>
          <View style={styles.userInnerDot} />
        </View>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedMarkerContainer: {
    transform: [{ scale: 1.25 }],
  },
  pinBubble: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBubble: {
    borderColor: '#FDE047', // Yellow highlight border
    borderWidth: 3,
  },
  pinIconText: {
    fontSize: 16,
  },
  pinArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 0,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    alignSelf: 'center',
  },
  calloutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    maxWidth: 220,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  calloutCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 4,
  },
  calloutHint: {
    fontSize: 10,
    color: '#64748B',
  },
  userMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  userPulseRing: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(37, 99, 235, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.4)',
  },
  userDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  userInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
});
