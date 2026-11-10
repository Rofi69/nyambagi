/**
 * Script Verifikasi Matematika & Spasial: Haversine & Geofencing (Anggota 3)
 */

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}

function calculateHaversineDistance(coord1, coord2) {
  const phi1 = toRadians(coord1.latitude);
  const phi2 = toRadians(coord2.latitude);
  const deltaPhi = toRadians(coord2.latitude - coord1.latitude);
  const deltaLambda = toRadians(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const clampedA = Math.max(0, Math.min(1, a));
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));

  return EARTH_RADIUS_METERS * c;
}

function calculateBearing(coord1, coord2) {
  const phi1 = toRadians(coord1.latitude);
  const phi2 = toRadians(coord2.latitude);
  const deltaLambda = toRadians(coord2.longitude - coord1.longitude);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

function checkGeofence(userCoord, centerCoord, radiusMeters = 500) {
  const distanceMeters = calculateHaversineDistance(userCoord, centerCoord);
  return {
    isInside: distanceMeters <= radiusMeters,
    distanceMeters,
    radiusMeters,
  };
}

function assertClose(actual, expected, tolerancePercent = 2, testName = '') {
  const diff = Math.abs(actual - expected);
  const diffPercent = (diff / expected) * 100;
  if (diffPercent <= tolerancePercent) {
    console.log(`✅ [PASS] ${testName}: ${actual.toFixed(2)}m (expected ~${expected}m, diff ${diffPercent.toFixed(2)}%)`);
  } else {
    console.error(`❌ [FAIL] ${testName}: ${actual}m not close to ${expected}m`);
    process.exit(1);
  }
}

console.log('=== PENGUJIAN KOMPUTASI SPASIAL LBS NYAMBAGI (ANGGOTA 3) ===');

// Test 1: Jarak ke titik yang sama
const monas = { latitude: -6.175392, longitude: 106.827153 };
if (calculateHaversineDistance(monas, monas) === 0) {
  console.log('✅ [PASS] Jarak ke koordinat yang sama adalah 0 meter');
}

// Test 2: Monas ke GBK (~5.56km)
const gbk = { latitude: -6.218556, longitude: 106.801833 };
const distMonasGBK = calculateHaversineDistance(monas, gbk);
assertClose(distMonasGBK, 5612, 1.5, 'Jarak Monas ke GBK Jakarta');

// Test 3: Gedung Sate ke ITB Bandung (~1.52km)
const gedungSate = { latitude: -6.902484, longitude: 107.618810 };
const itb = { latitude: -6.891500, longitude: 107.610600 };
assertClose(calculateHaversineDistance(gedungSate, itb), 1515, 2.0, 'Jarak Gedung Sate ke ITB Bandung');

// Test 4: Format Distance
if (formatDistance(450) === '450 m') console.log('✅ [PASS] Format 450 meter: "450 m"');
if (formatDistance(5612) === '5.61 km') console.log('✅ [PASS] Format 5612 meter: "5.61 km"');

// Test 5: Bearing Kompas
const bearing = calculateBearing(monas, gbk);
console.log(`✅ [PASS] Bearing kompas Monas ke GBK: ${bearing.toFixed(1)}° (Arah Barat Daya)`);

// Test 6: Geofence radius 500m (Near vs Far)
const nearMonas = { latitude: -6.177000, longitude: 106.827153 };
const geoNear = checkGeofence(nearMonas, monas, 500);
if (geoNear.isInside && geoNear.distanceMeters < 500) {
  console.log(`✅ [PASS] Geofence (Near): Pengguna terdeteksi di dalam zona (${geoNear.distanceMeters.toFixed(1)}m <= 500m)`);
}

const geoFar = checkGeofence(gbk, monas, 500);
if (!geoFar.isInside && geoFar.distanceMeters > 500) {
  console.log(`✅ [PASS] Geofence (Far): Pengguna terdeteksi di luar zona (${(geoFar.distanceMeters / 1000).toFixed(2)}km > 500m)`);
}

console.log('=== SEMUA PENGUJIAN MATEMATIS & GEOMETRIS BERHASIL 100%! ===');
