import type { NyambagiPOI } from '../types/location';

/**
 * Data mock titik distribusi bantuan Nyambagi untuk pengujian spasial & visualisasi Custom Markers.
 * Berpusat di area strategis untuk simulasi kalkulasi jarak Haversine.
 */
export const NYAMBAGI_POIS: NyambagiPOI[] = [
  {
    id: 'poi-1',
    name: 'Posko Utama Nyambagi Pusat',
    category: 'posko_utama',
    description: 'Pusat koordinasi logistik relawan, pendataan donatur, dan distribusi darurat.',
    coordinates: {
      latitude: -6.175392,
      longitude: 106.827153, // Kawasan Monas
    },
    address: 'Jl. Medan Merdeka Barat No. 1, Jakarta Pusat',
    contactPerson: 'Budi Santoso (0812-3456-7890)',
    stockStatus: 'available',
  },
  {
    id: 'poi-2',
    name: 'Dapur Umum Nyambagi Menteng',
    category: 'makanan_siap_saji',
    description: 'Penyediaan 500 porsi makanan siap saji hangat per hari untuk warga terdampak.',
    coordinates: {
      latitude: -6.195150,
      longitude: 106.832280, // Kawasan Menteng
    },
    address: 'Jl. HOS Cokroaminoto No. 42, Menteng',
    contactPerson: 'Siti Rahma (0813-9876-5432)',
    stockStatus: 'available',
  },
  {
    id: 'poi-3',
    name: 'Gudang Distribusi Sembako Tanah Abang',
    category: 'sembako',
    description: 'Paket sembako beras 5kg, minyak goreng 2L, gula pasir, dan mi instan.',
    coordinates: {
      latitude: -6.187320,
      longitude: 106.814340, // Tanah Abang
    },
    address: 'Jl. Kebon Kacang Raya Blok C, Tanah Abang',
    contactPerson: 'Ahmad Fauzi (0815-1122-3344)',
    stockStatus: 'limited',
  },
  {
    id: 'poi-4',
    name: 'Pos Layanan Kesehatan & Obat Senayan',
    category: 'medis',
    description: 'Penyaluran obat-obatan dasar, vitamin, perban, masker, dan pemeriksaan tensi gratis.',
    coordinates: {
      latitude: -6.218556,
      longitude: 106.801833, // Area GBK Senayan
    },
    address: 'Pintu 7 Gelora Bung Karno, Senayan',
    contactPerson: 'dr. Nina Marlina (0811-2233-4455)',
    stockStatus: 'available',
  },
  {
    id: 'poi-5',
    name: 'Drop Point Pakaian Layak Pakai Salemba',
    category: 'pakaian',
    description: 'Pakaian pria, wanita, dan anak-anak bersih layak pakai yang siap disalurkan.',
    coordinates: {
      latitude: -6.196650,
      longitude: 106.851900, // Salemba / UI Salemba
    },
    address: 'Jl. Salemba Raya No. 18, Senen',
    contactPerson: 'Rian Pratama (0878-4455-6677)',
    stockStatus: 'available',
  },
  {
    id: 'poi-6',
    name: 'Hub Bantuan Logistik Tebet',
    category: 'sembako',
    description: 'Distribusi sembako dan perlengkapan sanitasi higienis keluarga.',
    coordinates: {
      latitude: -6.232580,
      longitude: 106.853240, // Tebet
    },
    address: 'Jl. Tebet Barat Dalam Raya No. 25, Tebet',
    contactPerson: 'Dewi Lestari (0856-7788-9900)',
    stockStatus: 'depleted',
  },
];

export const CATEGORY_METADATA: Record<
  NyambagiPOI['category'],
  { label: string; color: string; iconSymbol: string }
> = {
  posko_utama: {
    label: 'Posko Utama',
    color: '#8B5CF6', // Purple
    iconSymbol: 'building.columns.fill',
  },
  makanan_siap_saji: {
    label: 'Makanan Siap Saji',
    color: '#F59E0B', // Amber
    iconSymbol: 'takeoutbag.and.cup.and.straw.fill',
  },
  sembako: {
    label: 'Sembako',
    color: '#10B981', // Emerald Green
    iconSymbol: 'cart.fill',
  },
  medis: {
    label: 'Bantuan Medis',
    color: '#EF4444', // Red
    iconSymbol: 'cross.case.fill',
  },
  pakaian: {
    label: 'Pakaian Layak',
    color: '#3B82F6', // Blue
    iconSymbol: 'tshirt.fill',
  },
};
