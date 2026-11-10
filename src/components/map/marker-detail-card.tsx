import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { NyambagiPOI, SpatialDistanceResult } from '@/types/location';
import { CATEGORY_METADATA } from '@/constants/nyambagi-poi';

interface MarkerDetailCardProps {
  poi: NyambagiPOI;
  distanceResult: SpatialDistanceResult | null;
  onCenterOnMarker: () => void;
  onClose: () => void;
}

function getCompassDirection(bearing?: number): string {
  if (bearing === undefined) return '';
  const directions = ['U', 'TL', 'T', 'TG', 'S', 'BD', 'B', 'BL'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

export function MarkerDetailCard({
  poi,
  distanceResult,
  onCenterOnMarker,
  onClose,
}: MarkerDetailCardProps) {
  const meta = CATEGORY_METADATA[poi.category];

  const stockBadgeConfig = {
    available: { text: 'Stok Tersedia', bg: '#DCFCE7', color: '#166534' },
    limited: { text: 'Stok Terbatas', bg: '#FEF9C3', color: '#854D0E' },
    depleted: { text: 'Stok Habis', bg: '#FEE2E2', color: '#991B1B' },
  }[poi.stockStatus];

  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <View style={styles.categoryBadgeRow}>
          <View style={[styles.categoryPill, { backgroundColor: meta.color }]}>
            <Text style={styles.categoryPillText}>{meta.label}</Text>
          </View>
          <View style={[styles.stockPill, { backgroundColor: stockBadgeConfig.bg }]}>
            <Text style={[styles.stockPillText, { color: stockBadgeConfig.color }]}>
              {stockBadgeConfig.text}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.poiTitle}>{poi.name}</Text>
      <Text style={styles.poiAddress}>📍 {poi.address}</Text>

      {/* Komputasi Spasial Haversine Card */}
      <View style={styles.haversineSection}>
        <View style={styles.haversineBadgeRow}>
          <Text style={styles.haversineBadge}>📐 Komputasi Spasial Haversine</Text>
        </View>

        <View style={styles.distanceValueRow}>
          {distanceResult ? (
            <>
              <Text style={styles.distanceMainText}>{distanceResult.formatted}</Text>
              <Text style={styles.distanceSubText}>
                jarak lurus dari posisi Anda
                {distanceResult.bearing !== undefined &&
                  ` • ${distanceResult.bearing.toFixed(0)}° (${getCompassDirection(distanceResult.bearing)})`}
              </Text>
            </>
          ) : (
            <Text style={styles.distanceSubText}>
              Memuat kalkulasi jarak dari GPS perangkat...
            </Text>
          )}
        </View>
      </View>

      <Text style={styles.poiDescription}>{poi.description}</Text>

      {poi.contactPerson && (
        <Text style={styles.contactText}>📞 Kontak: {poi.contactPerson}</Text>
      )}

      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={styles.primaryActionButton}
          onPress={onCenterOnMarker}>
          <Text style={styles.primaryActionButtonText}>🎯 Pusatkan Marker</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  stockPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  poiTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  poiAddress: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 10,
  },
  haversineSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  haversineBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  haversineBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  distanceValueRow: {
    flexDirection: 'column',
  },
  distanceMainText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  distanceSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  poiDescription: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
    marginBottom: 6,
  },
  contactText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
