import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Circle, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';

import { NYAMBAGI_POIS } from '@/constants/nyambagi-poi';
import { CustomMapMarker, UserMapMarker } from '@/components/map/custom-map-marker';
import { MarkerDetailCard } from '@/components/map/marker-detail-card';
import { useLocationTracking } from '@/hooks/use-location-tracking';
import { calculateSpatialDistance } from '@/utils/spatial/haversine';
import { checkGeofence, getActiveGeofences } from '@/utils/spatial/geofencing';
import { SpatialStorageService } from '@/services/storage/spatial-storage';
import { NyambagiPOI, TrackingMode } from '@/types/location';

// Koordinat awal default (Pusat Jakarta)
const DEFAULT_COORDINATE = {
  latitude: -6.195,
  longitude: 106.827,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09,
};

export default function MapScreen() {
  const mapRef = useRef<MapView | null>(null);
  const {
    location,
    error,
    isTracking,
    permissionStatus,
    trackingMode,
    currentInterval,
    setTrackingMode,
    refreshLocation,
    requestPermission,
  } = useLocationTracking('adaptive');

  const [selectedPoi, setSelectedPoi] = useState<NyambagiPOI | null>(null);
  const [showPolyline, setShowPolyline] = useState<boolean>(true);
  const [showGeofenceCircle, setShowGeofenceCircle] = useState<boolean>(true);
  const [showModeSelector, setShowModeSelector] = useState<boolean>(false);
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);

  // Simpan cache POI ke Scoped Storage pada mount awal
  useEffect(() => {
    SpatialStorageService.cachePOIsLocally(NYAMBAGI_POIS);
  }, []);

  // Simpan riwayat lokasi otomatis ke Scoped Storage saat update valid masuk
  useEffect(() => {
    if (location) {
      SpatialStorageService.saveLocationLog(location);
    }
  }, [location]);

  // Kalkulasi jarak Haversine ke marker yang dipilih secara real-time
  const selectedDistanceResult = useMemo(() => {
    if (!selectedPoi || !location) return null;
    return calculateSpatialDistance(
      { latitude: location.latitude, longitude: location.longitude },
      selectedPoi.coordinates
    );
  }, [selectedPoi, location]);

  // Deteksi Geofencing posko aktif di sekitar user
  const activeGeofences = useMemo(() => {
    if (!location) return [];
    return getActiveGeofences(
      { latitude: location.latitude, longitude: location.longitude },
      NYAMBAGI_POIS,
      500 // radius 500 meter
    );
  }, [location]);

  const handleCenterOnUser = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        },
        800
      );
    } else {
      refreshLocation();
    }
  };

  const handleCenterOnMarker = (poi: NyambagiPOI) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: poi.coordinates.latitude,
          longitude: poi.coordinates.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        800
      );
    }
  };

  const handleManualSaveLog = async () => {
    if (!location) {
      Alert.alert('Info', 'Belum ada data koordinat GPS yang terkunci.');
      return;
    }
    const success = await SpatialStorageService.saveLocationLog(location);
    if (success) {
      setSaveStatusMessage('💾 Log koordinat berhasil disimpan ke Scoped Storage!');
      setTimeout(() => setSaveStatusMessage(null), 3000);
    } else {
      setSaveStatusMessage('Penyimpanan lokal diabaikan pada platform web.');
      setTimeout(() => setSaveStatusMessage(null), 3000);
    }
  };

  // Garis lurus (Polyline) antara posisi user dan target bantuan
  const polylineCoordinates = useMemo(() => {
    if (!selectedPoi || !location || !showPolyline) return [];
    return [
      { latitude: location.latitude, longitude: location.longitude },
      selectedPoi.coordinates,
    ];
  }, [selectedPoi, location, showPolyline]);

  // Tampilan fallback ramah browser bila dijalankan di Web
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.webContainer}>
        <ScrollView contentContainerStyle={styles.webScrollContent}>
          <View style={styles.webHeader}>
            <Text style={styles.webTitle}>Modul LBS & Interactive Mapping Engine</Text>
            <Text style={styles.webSubtitle}>
              Nyambagi — Anggota 3: Lead Hardware & Spatial/Network Engineer
            </Text>
          </View>

          {/* LBS Status Telemetry */}
          <View style={styles.telemetryCard}>
            <Text style={styles.telemetryCardTitle}>📡 Status Telemetri LBS</Text>
            <View style={styles.telemetryRow}>
              <Text style={styles.telemetryLabel}>Status Tracking:</Text>
              <Text style={styles.telemetryValue}>
                {isTracking ? '🟢 Aktif (Streaming)' : '🔴 Non-aktif'}
              </Text>
            </View>
            <View style={styles.telemetryRow}>
              <Text style={styles.telemetryLabel}>Mode Tracking:</Text>
              <Text style={styles.telemetryValue}>{trackingMode.toUpperCase()}</Text>
            </View>
            <View style={styles.telemetryRow}>
              <Text style={styles.telemetryLabel}>Adaptive Interval:</Text>
              <Text style={styles.telemetryValue}>
                {currentInterval.distanceInterval}m / {currentInterval.timeInterval}ms
              </Text>
            </View>
            <View style={styles.telemetryRow}>
              <Text style={styles.telemetryLabel}>Koordinat Pengguna:</Text>
              <Text style={styles.telemetryValue}>
                {location
                  ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                  : 'Menunggu GPS...'}
              </Text>
            </View>
            <View style={styles.telemetryRow}>
              <Text style={styles.telemetryLabel}>Status Geofencing:</Text>
              <Text style={styles.telemetryValue}>
                {activeGeofences.length > 0
                  ? `🟢 Dalam Zona ${activeGeofences[0].poi.name}`
                  : '⚪ Di Luar Zona Posko'}
              </Text>
            </View>
          </View>

          {/* List POI & Haversine calculation */}
          <Text style={styles.webSectionTitle}>Daftar Titik Distribusi & Jarak Haversine</Text>
          {NYAMBAGI_POIS.map((poi) => {
            const userCoord = location
              ? { latitude: location.latitude, longitude: location.longitude }
              : { latitude: DEFAULT_COORDINATE.latitude, longitude: DEFAULT_COORDINATE.longitude };
            const dist = calculateSpatialDistance(userCoord, poi.coordinates);
            const geofence = checkGeofence(userCoord, poi.coordinates, 500);

            return (
              <View key={poi.id} style={styles.webPoiCard}>
                <View style={styles.webPoiHeader}>
                  <Text style={styles.webPoiName}>{poi.name}</Text>
                  <Text style={styles.webPoiDistance}>{dist.formatted}</Text>
                </View>
                <Text style={styles.webPoiAddress}>📍 {poi.address}</Text>
                <Text style={styles.webPoiDesc}>{poi.description}</Text>
                <Text style={styles.webHaversineInfo}>
                  📐 Formulasi Haversine: {dist.meters.toFixed(1)} meter (Bearing: {dist.bearing?.toFixed(1)}°)
                </Text>
                <Text
                  style={[
                    styles.webGeofenceInfo,
                    { color: geofence.isInside ? '#16A34A' : '#64748B' },
                  ]}>
                  🎯 Geofence (500m): {geofence.isInside ? 'Di Dalam Jangkauan' : 'Di Luar Radius'}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={DEFAULT_COORDINATE}
        showsCompass
        showsScale
        toolbarEnabled={false}>
        {/* Custom Marker Posisi Pengguna */}
        {location && <UserMapMarker location={location} />}

        {/* Custom Markers Titik Distribusi Nyambagi */}
        {NYAMBAGI_POIS.map((poi) => (
          <CustomMapMarker
            key={poi.id}
            poi={poi}
            isSelected={selectedPoi?.id === poi.id}
            onPress={(clicked) => setSelectedPoi(clicked)}
          />
        ))}

        {/* Lingkaran Visual Geofencing Radius Posko Bantuan */}
        {selectedPoi && showGeofenceCircle && (
          <Circle
            center={selectedPoi.coordinates}
            radius={500}
            fillColor="rgba(37, 99, 235, 0.15)"
            strokeColor="#2563EB"
            strokeWidth={2}
          />
        )}

        {/* Garis Lurus Kalkulasi Jarak Haversine */}
        {polylineCoordinates.length === 2 && (
          <Polyline
            coordinates={polylineCoordinates}
            strokeColor="#2563EB"
            strokeWidth={3}
            lineDashPattern={[6, 4]}
          />
        )}
      </MapView>

      {/* Floating Header & Telemetry LBS */}
      <SafeAreaView style={styles.floatingHeaderContainer} pointerEvents="box-none">
        <View style={styles.headerGlassCard}>
          <View style={styles.headerLeft}>
            <Text style={styles.appTitleText}>Peta Nyambagi</Text>
            <View style={styles.statusIndicatorRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isTracking ? '#22C55E' : '#EF4444' },
                ]}
              />
              <Text style={styles.statusIndicatorText}>
                {isTracking
                  ? `LBS: ${currentInterval.distanceInterval}m • ${currentInterval.timeInterval / 1000}s`
                  : 'LBS: Offline'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.modePillButton}
            onPress={() => setShowModeSelector(!showModeSelector)}>
            <Text style={styles.modePillText}>
              ⚙️ {trackingMode === 'adaptive' ? 'Adaptif' : trackingMode}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Banner Notifikasi Geofencing Aktif */}
        {activeGeofences.length > 0 && (
          <View style={styles.geofenceActiveBanner}>
            <Text style={styles.geofenceActiveText}>
              📍 Anda berada dalam radius zona bantuan:{' '}
              <Text style={styles.geofenceActiveBold}>{activeGeofences[0].poi.name}</Text>
            </Text>
          </View>
        )}

        {/* Banner Notifikasi Simpan Storage */}
        {saveStatusMessage && (
          <View style={styles.storageStatusBanner}>
            <Text style={styles.storageStatusText}>{saveStatusMessage}</Text>
          </View>
        )}

        {/* Mode Selector Dropdown */}
        {showModeSelector && (
          <View style={styles.modeDropdownCard}>
            <Text style={styles.dropdownTitle}>Pilih Profil Tracking Jarak:</Text>
            {(['adaptive', 'high-accuracy', 'balanced', 'passive'] as TrackingMode[]).map(
              (m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.modeOptionRow,
                    trackingMode === m && styles.selectedModeOption,
                  ]}
                  onPress={() => {
                    setTrackingMode(m);
                    setShowModeSelector(false);
                  }}>
                  <Text
                    style={[
                      styles.modeOptionText,
                      trackingMode === m && styles.selectedModeOptionText,
                    ]}>
                    {m === 'adaptive' && '⚡ Adaptif (Dynamic Kecepatan)'}
                    {m === 'high-accuracy' && '🎯 Presisi Tinggi (2m / 1s)'}
                    {m === 'balanced' && '⚖️ Seimbang (10m / 4s)'}
                    {m === 'passive' && '🔋 Hemat Daya (25m / 10s)'}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        )}

        {/* Error / Permission Banner */}
        {error && (
          <TouchableOpacity
            style={styles.errorBanner}
            onPress={() => requestPermission()}>
            <Text style={styles.errorBannerText}>⚠️ {error} (Ketuk untuk izin)</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>

      {/* Floating Action Buttons di samping kanan */}
      <View style={styles.floatingActionButtons}>
        <TouchableOpacity
          style={styles.actionFab}
          onPress={handleCenterOnUser}
          accessibilityLabel="Pusatkan Lokasi Saya">
          <Text style={styles.actionFabIcon}>🎯</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionFab}
          onPress={() => setShowPolyline(!showPolyline)}
          accessibilityLabel="Toggle Garis Lurus">
          <Text style={styles.actionFabIcon}>{showPolyline ? '📏' : '📐'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionFab}
          onPress={() => setShowGeofenceCircle(!showGeofenceCircle)}
          accessibilityLabel="Toggle Lingkaran Geofence">
          <Text style={styles.actionFabIcon}>{showGeofenceCircle ? '⭕' : '🔘'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionFab}
          onPress={handleManualSaveLog}
          accessibilityLabel="Simpan Log GPS ke Scoped Storage">
          <Text style={styles.actionFabIcon}>💾</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionFab}
          onPress={refreshLocation}
          accessibilityLabel="Segarkan GPS">
          <Text style={styles.actionFabIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Detail Card saat Marker Diklik */}
      {selectedPoi && (
        <MarkerDetailCard
          poi={selectedPoi}
          distanceResult={selectedDistanceResult}
          onCenterOnMarker={() => handleCenterOnMarker(selectedPoi)}
          onClose={() => setSelectedPoi(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  floatingHeaderContainer: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  headerGlassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'column',
  },
  appTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusIndicatorText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  modePillButton: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  modePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  geofenceActiveBanner: {
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    padding: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  geofenceActiveText: {
    fontSize: 11,
    color: '#065F46',
    textAlign: 'center',
  },
  geofenceActiveBold: {
    fontWeight: '700',
  },
  storageStatusBanner: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  storageStatusText: {
    fontSize: 11,
    color: '#15803D',
    textAlign: 'center',
    fontWeight: '600',
  },
  modeDropdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    padding: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropdownTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  modeOptionRow: {
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  selectedModeOption: {
    backgroundColor: '#EFF6FF',
  },
  modeOptionText: {
    fontSize: 12,
    color: '#334155',
  },
  selectedModeOptionText: {
    color: '#2563EB',
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    fontSize: 11,
    color: '#991B1B',
    textAlign: 'center',
  },
  floatingActionButtons: {
    position: 'absolute',
    right: 16,
    top: 100,
    gap: 10,
    zIndex: 8,
  },
  actionFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionFabIcon: {
    fontSize: 18,
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  webScrollContent: {
    padding: 24,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  webHeader: {
    marginBottom: 20,
  },
  webTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  webSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  telemetryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  telemetryCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 10,
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  telemetryLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  telemetryValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  webSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  webPoiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  webPoiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  webPoiName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  webPoiDistance: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
  },
  webPoiAddress: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 4,
  },
  webPoiDesc: {
    fontSize: 12,
    color: '#334155',
    marginBottom: 6,
  },
  webHaversineInfo: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
  },
  webGeofenceInfo: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
