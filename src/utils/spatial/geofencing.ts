import type { Coordinates, NyambagiPOI } from '../../types/location';
import { calculateHaversineDistance } from './haversine';

export interface GeofenceResult {
  isInside: boolean;
  distanceMeters: number;
  radiusMeters: number;
}

export interface ActiveGeofence {
  poi: NyambagiPOI;
  distanceMeters: number;
  radiusMeters: number;
}

// Radius default zona posko bantuan Nyambagi (500 meter)
export const DEFAULT_GEOFENCE_RADIUS_METERS = 500;

/**
 * Mengecek apakah suatu titik koordinat berada di dalam radius zona geofence.
 *
 * @param userCoord Koordinat pengguna saat ini
 * @param centerCoord Titik pusat geofence (misal koordinat posko bantuan)
 * @param radiusMeters Batas radius dalam meter (default 500m)
 */
export function checkGeofence(
  userCoord: Coordinates,
  centerCoord: Coordinates,
  radiusMeters: number = DEFAULT_GEOFENCE_RADIUS_METERS
): GeofenceResult {
  const distanceMeters = calculateHaversineDistance(userCoord, centerCoord);
  const isInside = distanceMeters <= radiusMeters;

  return {
    isInside,
    distanceMeters,
    radiusMeters,
  };
}

/**
 * Mendeteksi posko Nyambagi mana saja yang saat ini menaungi posisi pengguna.
 */
export function getActiveGeofences(
  userCoord: Coordinates,
  pois: NyambagiPOI[],
  radiusMeters: number = DEFAULT_GEOFENCE_RADIUS_METERS
): ActiveGeofence[] {
  const active: ActiveGeofence[] = [];

  for (const poi of pois) {
    const res = checkGeofence(userCoord, poi.coordinates, radiusMeters);
    if (res.isInside) {
      active.push({
        poi,
        distanceMeters: res.distanceMeters,
        radiusMeters,
      });
    }
  }

  // Urutkan dari yang paling dekat
  return active.sort((a, b) => a.distanceMeters - b.distanceMeters);
}
