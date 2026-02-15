// Trip types and interfaces

export type TripType = 'day' | 'road' | 'overnight';

export type TripStatus = 'forecast' | 'active' | 'completed';

export interface Location {
  lat: number;
  lng: number;
  name: string;
  address?: string;
  thumbnailUrl?: string;
}

export interface CostItem {
  label: string;
  amount: number;
}

export interface TripCosts {
  transport: number;
  food: number;
  accommodation: number;
  entertainment: number;
  shopping: number;
  other: number;
}

export interface Trip {
  id: string;
  name: string;
  type: TripType;
  date: string;
  location?: Location;
  costs: {
    forecast: TripCosts;
    actual?: TripCosts;
  };
  status: TripStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  currency: string;
  currencySymbol: string;
  decimalPlaces: number;
  defaultTripType: TripType;
}

export const DEFAULT_COSTS: TripCosts = {
  transport: 0,
  food: 0,
  accommodation: 0,
  entertainment: 0,
  shopping: 0,
  other: 0,
};

export const TRIP_TYPE_LABELS: Record<TripType, string> = {
  day: 'Day Trip',
  road: 'Road Trip',
  overnight: 'Overnight',
};

export const TRIP_TYPE_ICONS: Record<TripType, string> = {
  day: 'sun',
  road: 'car',
  overnight: 'moon',
};

export const COST_LABELS: Record<keyof TripCosts, string> = {
  transport: 'Transport',
  food: 'Food & Drinks',
  accommodation: 'Accommodation',
  entertainment: 'Entertainment',
  shopping: 'Shopping',
  other: 'Other',
};

export const DEFAULT_SETTINGS: AppSettings = {
  currency: 'USD',
  currencySymbol: '$',
  decimalPlaces: 2,
  defaultTripType: 'day',
};

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
];
