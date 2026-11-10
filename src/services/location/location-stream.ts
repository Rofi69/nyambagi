import { Subject, Observable } from 'rxjs';
import { filter, map, distinctUntilChanged, share } from 'rxjs/operators';
import type * as Location from 'expo-location';
import type { UserLocation } from '@/types/location';
import { calculateHaversineDistance } from '@/utils/spatial/haversine';

/**
 * Service pengolah alur data asinkron berbasis RxJS Pipeline
 * Sesuai dengan spesifikasi peran Anggota 3: Lead Hardware & Spatial/Network Engineer
 * "Penanganan Alur Data Asinkron & Filtering (RxJS Pipeline)"
 */
class LocationStreamService {
  private rawLocation$ = new Subject<Location.LocationObject>();

  /**
   * Alur data lokasi yang telah dibersihkan:
   * 1. Noise Filter: Menyaring lonjakan ketidakakuratan satelit (accuracy > 50 meter diabaikan).
   * 2. Data Transformation: Mapping ke struktur UserLocation.
   * 3. Spatial Jitter Filter: Menghilangkan getaran GPS mikro (< 0.5 meter) saat perangkat statis.
   */
  public location$: Observable<UserLocation> = this.rawLocation$.pipe(
    filter((loc) => {
      const acc = loc.coords.accuracy;
      // Bila informasi akurasi ada, tolak jika noise > 50 meter
      return acc === null || acc <= 50;
    }),
    map((loc): UserLocation => ({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      accuracy: loc.coords.accuracy,
      altitude: loc.coords.altitude,
      heading: loc.coords.heading,
      speed: loc.coords.speed,
      timestamp: loc.timestamp,
    })),
    distinctUntilChanged((prev, curr) => {
      // Jitter threshold filter: Abaikan pergerakan semu < 0.5 meter
      const drift = calculateHaversineDistance(
        { latitude: prev.latitude, longitude: prev.longitude },
        { latitude: curr.latitude, longitude: curr.longitude }
      );
      return drift < 0.5;
    }),
    share()
  );

  /**
   * Mengalirkan lokasi mentah dari hardware GPS expo-location ke dalam RxJS pipeline.
   */
  public emitRawLocation(loc: Location.LocationObject): void {
    this.rawLocation$.next(loc);
  }
}

export const locationStream = new LocationStreamService();
