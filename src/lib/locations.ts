/**
 * Delivery regions and sub-areas for SOS Hardware & Glassmart.
 * Used by the checkout location selector.
 */

export type RegionKey = 'Nyeri' | 'Nairobi' | 'Other';

export interface RegionConfig {
  key: RegionKey;
  label: string;
  city: string;
  /** Empty array means "free-text town" (used by Other). */
  subAreas: string[];
  /** Free-form note shown on the order, helps the dispatcher prioritise. */
  noteHint: string;
}

export const REGIONS: RegionConfig[] = [
  {
    key: 'Nyeri',
    label: 'Nyeri (Same-day available)',
    city: 'Nyeri',
    subAreas: [
      'Nyeri Town (CBD)',
      "Ruring'u",
      'Kiganjo',
      'Mathari',
      'Kamakwa',
      'Kangemi',
      'Karatina',
      'Othaya',
      'Mukurweini',
      'Naromoru',
    ],
    noteHint: 'Same-day delivery if ordered before 2pm.',
  },
  {
    key: 'Nairobi',
    label: 'Nairobi (1–2 day delivery)',
    city: 'Nairobi',
    subAreas: [
      'CBD',
      'Westlands',
      'Karen',
      'Kilimani',
      'Lavington',
      'Parklands',
      'Eastleigh',
      'South B / South C',
      'Embakasi',
      'Kasarani',
      'Ruaka',
      'Kiambu Road',
      'Thika Road',
      'Ngong Road',
    ],
    noteHint: 'Dispatched daily via courier.',
  },
  {
    key: 'Other',
    label: 'Other (Countrywide courier)',
    city: '',
    subAreas: [],
    noteHint: 'We dispatch via G4S / Easy Coach. Customer covers courier fee.',
  },
];

export const getRegion = (key: RegionKey) =>
  REGIONS.find((r) => r.key === key) ?? REGIONS[0];

/**
 * Format the saved delivery_address field consistently so the admin can
 * sort & filter orders by region.
 */
export const formatDeliveryAddress = (input: {
  region: RegionKey;
  subArea: string;
  city: string;
  street: string;
  notes?: string;
}) => {
  const parts = [
    `[${input.region}]`,
    input.subArea ? input.subArea : null,
    input.street,
    input.city,
  ].filter(Boolean);
  const base = parts.join(' • ');
  return input.notes ? `${base} — Notes: ${input.notes}` : base;
};