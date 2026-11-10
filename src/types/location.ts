export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null; // meters per second
  timestamp: number;
}

export type TrackingMode = 'adaptive' | 'high-accuracy' | 'balanced' | 'passive';

export type PermissionStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'restricted';

export type NyambagiCategory =
  | 'sembako'
  | 'medis'
  | 'pakaian'
  | 'makanan_siap_saji'
  | 'posko_utama';

export interface NyambagiPOI {
  id: string;
  name: string;
  category: NyambagiCategory;
  description: string;
  coordinates: Coordinates;
  address: string;
  contactPerson?: string;
  stockStatus: 'available' | 'limited' | 'depleted';
}

export interface SpatialDistanceResult {
  meters: number;
  kilometers: number;
  formatted: string;
  bearing?: number;
}
