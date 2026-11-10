import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { NyambagiPOI, UserLocation } from '@/types/location';

const STORAGE_DIR = FileSystem.documentDirectory || '';
const LOGS_FILE = `${STORAGE_DIR}nyambagi_location_logs.json`;
const CACHE_POI_FILE = `${STORAGE_DIR}nyambagi_poi_cache.json`;

/**
 * Service Manajemen Scoped Storage menggunakan expo-file-system
 * Sesuai peran Anggota 3: "Manajemen Izin Runtime & Scoped Storage (expo-file-system)"
 */
export class SpatialStorageService {
  /**
   * Menyimpan log riwayat koordinat GPS pengguna ke dalam scoped storage aplikasi secara aman.
   */
  public static async saveLocationLog(loc: UserLocation): Promise<boolean> {
    if (Platform.OS === 'web' || !STORAGE_DIR) {
      return false;
    }

    try {
      const existingLogs = await this.getLocationLogs();
      // Simpan maksimal 50 log terbaru untuk efisiensi penyimpanan
      const updatedLogs = [loc, ...existingLogs.slice(0, 49)];

      await FileSystem.writeAsStringAsync(LOGS_FILE, JSON.stringify(updatedLogs), {
        encoding: FileSystem.EncodingType.UTF8,
      });
      return true;
    } catch (err) {
      console.warn('Gagal menyimpan log lokasi ke Scoped Storage:', err);
      return false;
    }
  }

  /**
   * Mengambil riwayat log lokasi pengguna dari scoped storage.
   */
  public static async getLocationLogs(): Promise<UserLocation[]> {
    if (Platform.OS === 'web' || !STORAGE_DIR) {
      return [];
    }

    try {
      const info = await FileSystem.getInfoAsync(LOGS_FILE);
      if (!info.exists) {
        return [];
      }

      const content = await FileSystem.readAsStringAsync(LOGS_FILE, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      return JSON.parse(content) as UserLocation[];
    } catch (err) {
      console.warn('Gagal membaca log lokasi:', err);
      return [];
    }
  }

  /**
   * Menyimpan cache offline titik posko bantuan Nyambagi ke storage lokal.
   */
  public static async cachePOIsLocally(pois: NyambagiPOI[]): Promise<boolean> {
    if (Platform.OS === 'web' || !STORAGE_DIR) {
      return false;
    }

    try {
      await FileSystem.writeAsStringAsync(CACHE_POI_FILE, JSON.stringify(pois), {
        encoding: FileSystem.EncodingType.UTF8,
      });
      return true;
    } catch (err) {
      console.warn('Gagal menyimpan cache POI:', err);
      return false;
    }
  }

  /**
   * Membaca cache offline titik posko bantuan saat koneksi internet offline.
   */
  public static async loadCachedPOIs(): Promise<NyambagiPOI[] | null> {
    if (Platform.OS === 'web' || !STORAGE_DIR) {
      return null;
    }

    try {
      const info = await FileSystem.getInfoAsync(CACHE_POI_FILE);
      if (!info.exists) {
        return null;
      }

      const content = await FileSystem.readAsStringAsync(CACHE_POI_FILE, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      return JSON.parse(content) as NyambagiPOI[];
    } catch (err) {
      console.warn('Gagal membaca cache POI:', err);
      return null;
    }
  }

  /**
   * Menghapus semua file log dan cache dalam scoped storage.
   */
  public static async clearStorage(): Promise<void> {
    if (Platform.OS === 'web' || !STORAGE_DIR) return;

    try {
      const logInfo = await FileSystem.getInfoAsync(LOGS_FILE);
      if (logInfo.exists) {
        await FileSystem.deleteAsync(LOGS_FILE, { idempotent: true });
      }
      const cacheInfo = await FileSystem.getInfoAsync(CACHE_POI_FILE);
      if (cacheInfo.exists) {
        await FileSystem.deleteAsync(CACHE_POI_FILE, { idempotent: true });
      }
    } catch (err) {
      console.warn('Gagal menghapus scoped storage:', err);
    }
  }
}
