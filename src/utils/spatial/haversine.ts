import type { Coordinates, SpatialDistanceResult } from '../../types/location';

const EARTH_RADIUS_METERS = 6371000; // Radius Bumi dalam meter (WGS-84 mean spherical radius)

/**
 * Mengubah derajat ke radian.
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Mengubah radian ke derajat.
 */
function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Menghitung jarak lurus (Great-Circle Distance) antara dua titik koordinat
 * menggunakan Formulasi Haversine.
 *
 * @param coord1 Titik koordinat awal { latitude, longitude }
 * @param coord2 Titik koordinat tujuan { latitude, longitude }
 * @returns Jarak dalam meter
 */
export function calculateHaversineDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const phi1 = toRadians(coord1.latitude);
  const phi2 = toRadians(coord2.latitude);
  const deltaPhi = toRadians(coord2.latitude - coord1.latitude);
  const deltaLambda = toRadians(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  // Math.min dan Math.max untuk mencegah domain error pada Math.sqrt akibat pembulatan floating point
  const clampedA = Math.max(0, Math.min(1, a));
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Menghitung initial bearing (sudut arah kompas dalam derajat 0..360)
 * dari titik awal menuju titik tujuan.
 */
export function calculateBearing(coord1: Coordinates, coord2: Coordinates): number {
  const phi1 = toRadians(coord1.latitude);
  const phi2 = toRadians(coord2.latitude);
  const deltaLambda = toRadians(coord2.longitude - coord1.longitude);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const initialBearing = toDegrees(Math.atan2(y, x));
  return (initialBearing + 360) % 360;
}

/**
 * Memformat jarak dalam meter ke bentuk teks yang mudah dibaca (misal: "350 m" atau "2.45 km").
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
}

/**
 * Menghitung detail lengkap spasial antara dua titik:
 * jarak (m & km), format teks, dan sudut bearing kompas.
 */
export function calculateSpatialDistance(
  coord1: Coordinates,
  coord2: Coordinates
): SpatialDistanceResult {
  const meters = calculateHaversineDistance(coord1, coord2);
  const kilometers = meters / 1000;
  const formatted = formatDistance(meters);
  const bearing = calculateBearing(coord1, coord2);

  return {
    meters,
    kilometers,
    formatted,
    bearing,
  };
}
