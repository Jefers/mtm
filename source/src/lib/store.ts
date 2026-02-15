import { useState, useEffect, useCallback } from 'react';
import { Trip, AppSettings, DEFAULT_SETTINGS } from './types';

const STORAGE_KEYS = {
  TRIPS: 'violet_voyage_trips',
  SETTINGS: 'violet_voyage_settings',
};

export function useTripStore() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedTrips = localStorage.getItem(STORAGE_KEYS.TRIPS);
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);

    if (savedTrips) {
      try {
        setTrips(JSON.parse(savedTrips));
      } catch (e) {
        console.error('Failed to load trips:', e);
      }
    }

    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }

    setIsLoaded(true);
  }, []);

  // Save trips to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));
    }
  }, [trips, isLoaded]);

  // Save settings to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }
  }, [settings, isLoaded]);

  const addTrip = useCallback((trip: Trip) => {
    setTrips(prev => [trip, ...prev]);
  }, []);

  const updateTrip = useCallback((id: string, updates: Partial<Trip>) => {
    setTrips(prev =>
      prev.map(trip =>
        trip.id === id
          ? { ...trip, ...updates, updatedAt: new Date().toISOString() }
          : trip
      )
    );
  }, []);

  const deleteTrip = useCallback((id: string) => {
    setTrips(prev => prev.filter(trip => trip.id !== id));
  }, []);

  const getTrip = useCallback(
    (id: string) => trips.find(trip => trip.id === id),
    [trips]
  );

  const calculateTripTotal = useCallback(
    (trip: Trip, type: 'forecast' | 'actual' = 'forecast') => {
      const costs = type === 'actual' && trip.costs.actual
        ? trip.costs.actual
        : trip.costs.forecast;

      return Object.values(costs).reduce((sum, amount) => sum + amount, 0);
    },
    []
  );

  const calculateGrandTotal = useCallback(
    (type: 'forecast' | 'actual' = 'forecast') => {
      return trips.reduce((total, trip) => {
        return total + calculateTripTotal(trip, type);
      }, 0);
    },
    [trips, calculateTripTotal]
  );

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const formatCurrency = useCallback(
    (amount: number) => {
      const { currencySymbol, decimalPlaces } = settings;
      return `${currencySymbol}${amount.toFixed(decimalPlaces)}`;
    },
    [settings]
  );

  const exportToJSON = useCallback(() => {
    const data = {
      trips,
      settings,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    return JSON.stringify(data, null, 2);
  }, [trips, settings]);

  const exportToCSV = useCallback(() => {
    const headers = [
      'ID',
      'Name',
      'Type',
      'Date',
      'Status',
      'Location',
      'Forecast Transport',
      'Forecast Food',
      'Forecast Accommodation',
      'Forecast Entertainment',
      'Forecast Shopping',
      'Forecast Other',
      'Forecast Total',
      'Actual Transport',
      'Actual Food',
      'Actual Accommodation',
      'Actual Entertainment',
      'Actual Shopping',
      'Actual Other',
      'Actual Total',
      'Notes',
      'Created At',
      'Updated At',
    ];

    const rows = trips.map(trip => {
      const forecastTotal = calculateTripTotal(trip, 'forecast');
      const actualTotal = trip.costs.actual
        ? calculateTripTotal(trip, 'actual')
        : 0;

      return [
        trip.id,
        `"${trip.name}"`,
        trip.type,
        trip.date,
        trip.status,
        trip.location?.name || '',
        trip.costs.forecast.transport,
        trip.costs.forecast.food,
        trip.costs.forecast.accommodation,
        trip.costs.forecast.entertainment,
        trip.costs.forecast.shopping,
        trip.costs.forecast.other,
        forecastTotal,
        trip.costs.actual?.transport || '',
        trip.costs.actual?.food || '',
        trip.costs.actual?.accommodation || '',
        trip.costs.actual?.entertainment || '',
        trip.costs.actual?.shopping || '',
        trip.costs.actual?.other || '',
        actualTotal,
        `"${trip.notes || ''}"`,
        trip.createdAt,
        trip.updatedAt,
      ];
    });

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }, [trips, calculateTripTotal]);

  return {
    trips,
    settings,
    isLoaded,
    addTrip,
    updateTrip,
    deleteTrip,
    getTrip,
    calculateTripTotal,
    calculateGrandTotal,
    updateSettings,
    formatCurrency,
    exportToJSON,
    exportToCSV,
  };
}

export type TripStore = ReturnType<typeof useTripStore>;
