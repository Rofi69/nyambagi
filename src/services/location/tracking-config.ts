import * as Location from 'expo-location';
import { TrackingMode } from '@/types/location';

export interface AdaptiveTrackingOptions {
  accuracy: Location.Accuracy;
  timeInterval: number; // millisecond
  distanceInterval: number; // meter
}

export const TRACKING_PROFILES: Record<TrackingMode, AdaptiveTrackingOptions> = {
  'high-accuracy': {
    accuracy: Location.Accuracy.Highest,
    timeInterval: 1000,
    distanceInterval: 2, // 2 meter
  },
  'balanced': {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 4000,
    distanceInterval: 10, // 10 meter
  },
  'passive': {
    accuracy: Location.Accuracy.Low,
    timeInterval: 10000,
    distanceInterval: 25, // 25 meter
  },
  'adaptive': {
    accuracy: Location.Accuracy.High,
    timeInterval: 2500,
    distanceInterval: 5, // Awal, akan disesuaikan otomatis berdasarkan kecepatan
  },
};

/**
 * Menghitung distanceInterval dan timeInterval adaptif berdasarkan kecepatan pengguna (speed dalam m/s).
 *
 * Logika optimasi perangkat & konsumsi daya:
 * - Kecepatan rendah / statis (v < 1 m/s): Menghemat baterai dengan memperlebar distanceInterval ke 10m dan timeInterval ke 5 detik.
 * - Kecepatan jalan kaki / lari (1 <= v < 5 m/s): Memberikan granularitas tinggi untuk navigasi pedestrian (5m / 2.5s).
 * - Kecepatan kendaraan sedang (5 <= v < 15 m/s): 15m / 1.5s.
 * - Kecepatan kendaraan tinggi (v >= 15 m/s): 30m / 1.0s untuk mencegah overloading pembaruan peta namun menjaga jalur tetap mulus.
 */
export function calculateAdaptiveInterval(speed: number | null): {
  distanceInterval: number;
  timeInterval: number;
} {
  if (speed === null || speed < 1) {
    return { distanceInterval: 10, timeInterval: 5000 };
  }
  if (speed < 5) {
    return { distanceInterval: 5, timeInterval: 2500 };
  }
  if (speed < 15) {
    return { distanceInterval: 15, timeInterval: 1500 };
  }
  return { distanceInterval: 30, timeInterval: 1000 };
}
