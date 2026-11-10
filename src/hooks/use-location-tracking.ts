import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import type { Subscription as RxSubscription } from 'rxjs';

import type {
  PermissionStatus,
  TrackingMode,
  UserLocation,
} from '@/types/location';
import { locationStream } from '@/services/location/location-stream';
import {
  calculateAdaptiveInterval,
  TRACKING_PROFILES,
} from '@/services/location/tracking-config';

export interface UseLocationTrackingResult {
  location: UserLocation | null;
  error: string | null;
  isTracking: boolean;
  permissionStatus: PermissionStatus;
  trackingMode: TrackingMode;
  currentInterval: {
    distanceInterval: number;
    timeInterval: number;
  };
  setTrackingMode: (mode: TrackingMode) => void;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  refreshLocation: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

export function useLocationTracking(
  initialMode: TrackingMode = 'adaptive'
): UseLocationTrackingResult {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('idle');
  const [trackingMode, setTrackingModeState] = useState<TrackingMode>(initialMode);
  const [currentInterval, setCurrentInterval] = useState<{
    distanceInterval: number;
    timeInterval: number;
  }>(() => {
    const profile = TRACKING_PROFILES[initialMode];
    return {
      distanceInterval: profile.distanceInterval,
      timeInterval: profile.timeInterval,
    };
  });

  const locationWatcherRef = useRef<Location.LocationSubscription | null>(null);
  const rxSubscriptionRef = useRef<RxSubscription | null>(null);
  const trackingModeRef = useRef<TrackingMode>(initialMode);
  const currentIntervalRef = useRef(currentInterval);

  trackingModeRef.current = trackingMode;
  currentIntervalRef.current = currentInterval;

  /**
   * Meminta izin runtime lokasi perangkat.
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setPermissionStatus('requesting');
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === Location.PermissionStatus.GRANTED) {
        setPermissionStatus('granted');
        setError(null);
        return true;
      } else {
        setPermissionStatus('denied');
        setError('Izin akses lokasi ditolak oleh pengguna.');
        return false;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal meminta izin lokasi.';
      setError(msg);
      setPermissionStatus('denied');
      return false;
    }
  }, []);

  /**
   * Menghentikan langganan tracking lokasi aktif.
   */
  const stopTracking = useCallback(() => {
    if (locationWatcherRef.current) {
      locationWatcherRef.current.remove();
      locationWatcherRef.current = null;
    }
    setIsTracking(false);
  }, []);

  /**
   * Memulai atau mengonfigurasi ulang watcher dengan interval tertentu.
   */
  const startWatcherWithInterval = useCallback(
    async (distInterval: number, timeInt: number, accuracy: Location.Accuracy) => {
      // Hapus watcher sebelumnya jika ada
      if (locationWatcherRef.current) {
        locationWatcherRef.current.remove();
        locationWatcherRef.current = null;
      }

      try {
        const sub = await Location.watchPositionAsync(
          {
            accuracy,
            timeInterval: timeInt,
            distanceInterval: distInterval,
          },
          (rawLoc) => {
            // Alirkan ke RxJS pipeline untuk filtering
            locationStream.emitRawLocation(rawLoc);
          }
        );

        locationWatcherRef.current = sub;
        setIsTracking(true);
        setCurrentInterval({ distanceInterval: distInterval, timeInterval: timeInt });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Gagal memulai pemantauan lokasi.';
        setError(msg);
        setIsTracking(false);
      }
    },
    []
  );

  /**
   * Memulai tracking lokasi sesuai mode yang dipilih.
   */
  const startTracking = useCallback(async () => {
    setError(null);
    let hasPerm = permissionStatus === 'granted';

    if (!hasPerm) {
      hasPerm = await requestPermission();
      if (!hasPerm) return;
    }

    try {
      // Ambil posisi awal segera agar UI tidak menunggu interval pertama
      const initialPos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      locationStream.emitRawLocation(initialPos);

      // Mulai watcher berdasarkan mode
      const mode = trackingModeRef.current;
      const profile = TRACKING_PROFILES[mode];

      await startWatcherWithInterval(
        profile.distanceInterval,
        profile.timeInterval,
        profile.accuracy
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mendapatkan lokasi awal.';
      setError(msg);
    }
  }, [permissionStatus, requestPermission, startWatcherWithInterval]);

  /**
   * Mengambil posisi saat ini secara manual.
   */
  const refreshLocation = useCallback(async () => {
    try {
      let hasPerm = permissionStatus === 'granted';
      if (!hasPerm) {
        hasPerm = await requestPermission();
        if (!hasPerm) return;
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      locationStream.emitRawLocation(current);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui lokasi.';
      setError(msg);
    }
  }, [permissionStatus, requestPermission]);

  /**
   * Mengubah mode tracking secara dinamis.
   */
  const setTrackingMode = useCallback(
    (mode: TrackingMode) => {
      setTrackingModeState(mode);
      trackingModeRef.current = mode;

      if (isTracking) {
        const profile = TRACKING_PROFILES[mode];
        startWatcherWithInterval(
          profile.distanceInterval,
          profile.timeInterval,
          profile.accuracy
        );
      }
    },
    [isTracking, startWatcherWithInterval]
  );

  /**
   * Langganan ke RxJS Pipeline untuk menerima lokasi yang sudah difilter & bebas noise.
   */
  useEffect(() => {
    rxSubscriptionRef.current = locationStream.location$.subscribe((cleanedLoc) => {
      setLocation(cleanedLoc);

      // Logika Adaptif: Jika dalam mode 'adaptive', periksa kecepatan dan recalibrate interval
      if (trackingModeRef.current === 'adaptive' && locationWatcherRef.current) {
        const adaptive = calculateAdaptiveInterval(cleanedLoc.speed);
        const current = currentIntervalRef.current;

        // Hanya kalibrasi ulang jika ada perubahan threshold interval yang signifikan
        if (
          Math.abs(adaptive.distanceInterval - current.distanceInterval) >= 5 ||
          Math.abs(adaptive.timeInterval - current.timeInterval) >= 1000
        ) {
          startWatcherWithInterval(
            adaptive.distanceInterval,
            adaptive.timeInterval,
            Location.Accuracy.High
          );
        }
      }
    });

    return () => {
      if (rxSubscriptionRef.current) {
        rxSubscriptionRef.current.unsubscribe();
        rxSubscriptionRef.current = null;
      }
    };
  }, [startWatcherWithInterval]);

  /**
   * Inisialisasi otomatis saat hook dipasang pertama kali.
   */
  useEffect(() => {
    startTracking();

    return () => {
      stopTracking();
    };
  }, [startTracking, stopTracking]);

  return {
    location,
    error,
    isTracking,
    permissionStatus,
    trackingMode,
    currentInterval,
    setTrackingMode,
    startTracking,
    stopTracking,
    refreshLocation,
    requestPermission,
  };
}
