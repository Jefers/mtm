import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import {
  Home,
  Plus,
  History,
  Settings,
  MapPin,
  Calendar,
  DollarSign,
  Car,
  Sun,
  Moon,
  Utensils,
  Building2,
  Sparkles,
  ShoppingBag,
  MoreHorizontal,
  Trash2,
  Edit3,
  Download,
  Upload,
  ChevronRight,
  X,
  Check,
  Wallet,
  Target,
  TrendingUp,
  Navigation,
  Image,
} from 'lucide-react';
import { Trip, TripType, TripStatus, TripCosts, DEFAULT_COSTS, COST_LABELS, CURRENCIES, AppSettings, DEFAULT_SETTINGS, Location } from './lib/types';

// Types for the store
interface TripStore {
  trips: Trip[];
  settings: AppSettings;
  isLoaded: boolean;
  addTrip: (trip: Trip) => void;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  getTrip: (id: string) => Trip | undefined;
  calculateTripTotal: (trip: Trip, type?: 'forecast' | 'actual') => number;
  calculateGrandTotal: (type?: 'forecast' | 'actual') => number;
  updateSettings: (updates: Partial<AppSettings>) => void;
  formatCurrency: (amount: number) => string;
  exportToJSON: () => string;
  exportToCSV: () => string;
}

// Create context
const TripContext = createContext<TripStore | null>(null);

const useTrips = () => {
  const context = useContext(TripContext);
  if (!context) throw new Error('useTrips must be used within TripProvider');
  return context;
};

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Format date
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Get trip type icon
const getTripTypeIcon = (type: TripType) => {
  switch (type) {
    case 'day': return <Sun className="w-4 h-4" />;
    case 'road': return <Car className="w-4 h-4" />;
    case 'overnight': return <Moon className="w-4 h-4" />;
  }
};

// Get cost icon
const getCostIcon = (key: keyof TripCosts) => {
  switch (key) {
    case 'transport': return <Car className="w-4 h-4" />;
    case 'food': return <Utensils className="w-4 h-4" />;
    case 'accommodation': return <Building2 className="w-4 h-4" />;
    case 'entertainment': return <Sparkles className="w-4 h-4" />;
    case 'shopping': return <ShoppingBag className="w-4 h-4" />;
    case 'other': return <MoreHorizontal className="w-4 h-4" />;
  }
};

// Glass Card Component
function GlassCard({ children, className = '', hover = false, onClick }: { children: React.ReactNode; className?: string; hover?: boolean; onClick?: () => void }) {
  return (
    <div
      className={`bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] ${hover ? 'transition-all duration-300 hover:bg-white/[0.12] hover:shadow-[0_0_40px_rgba(157,78,221,0.3)] hover:scale-[1.01]' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Header Component
function Header() {
  const { settings, formatCurrency, calculateGrandTotal } = useTrips();
  const forecastTotal = calculateGrandTotal('forecast');
  const actualTotal = calculateGrandTotal('actual');

  return (
    <header className="sticky top-0 z-50 bg-[#120a2e]/80 backdrop-blur-xl border-b border-white/10">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient">Violet Voyage</h1>
              <p className="text-xs text-white/50">Trip Planner</p>
            </div>
          </div>
        </div>
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-white/60">Grand Total</p>
                <p className="text-2xl font-bold text-gradient">{formatCurrency(actualTotal || forecastTotal)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/60">Forecast: {formatCurrency(forecastTotal)}</p>
              {actualTotal > 0 && (
                <p className="text-xs text-green-400">Actual: {formatCurrency(actualTotal)}</p>
              )}
            </div>
          </div>
        </GlassCard>
      </div>
    </header>
  );
}

// Navigation Component
function BottomNav({ currentPage, setCurrentPage }: { currentPage: string; setCurrentPage: (page: string) => void }) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'add', icon: Plus, label: 'Add Trip' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/[0.08] backdrop-blur-xl border-t border-white/15 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                isActive
                  ? 'text-primary bg-primary/20'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Trip Card Component
function TripCard({ trip, onClick }: { trip: Trip; onClick: () => void }) {
  const { formatCurrency, calculateTripTotal, settings } = useTrips();

  const forecastTotal = calculateTripTotal(trip, 'forecast');
  const actualTotal = trip.costs.actual ? calculateTripTotal(trip, 'actual') : null;
  const hasActual = trip.costs.actual !== undefined;

  const progress = hasActual && actualTotal !== null
    ? Math.min((actualTotal / forecastTotal) * 100, 150)
    : 0;

  return (
    <GlassCard hover className="p-4 cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            trip.type === 'day' ? 'bg-yellow-500/20 text-yellow-400' :
            trip.type === 'road' ? 'bg-blue-500/20 text-blue-400' :
            'bg-green-500/20 text-green-400'
          }`}>
            {getTripTypeIcon(trip.type)}
          </div>
          <div>
            <h3 className="font-semibold text-white">{trip.name}</h3>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Calendar className="w-3 h-3" />
              {formatDate(trip.date)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`status-dot ${
            trip.status === 'forecast' ? 'status-forecast' :
            trip.status === 'active' ? 'status-active' :
            'status-completed'
          }`} />
          <span className="text-xs capitalize text-white/60">{trip.status}</span>
        </div>
      </div>

      {trip.location && (
        <div className="flex items-center gap-2 text-xs text-white/50 mb-3">
          <MapPin className="w-3 h-3 text-primary" />
          {trip.location.name}
        </div>
      )}

      {trip.location?.thumbnailUrl && (
        <div className="mb-3 rounded-lg overflow-hidden h-24">
          <img
            src={trip.location.thumbnailUrl}
            alt={trip.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">Budget</span>
          <span className="font-semibold text-white">{formatCurrency(forecastTotal)}</span>
        </div>
        {hasActual && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Actual</span>
            <span className={`font-semibold ${actualTotal! > forecastTotal ? 'text-red-400' : 'text-green-400'}`}>
              {formatCurrency(actualTotal!)}
            </span>
          </div>
        )}
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    </GlassCard>
  );
}

// Trip Form Component
function TripForm({ trip, onSave, onCancel }: { trip?: Trip; onSave: (trip: Trip) => void; onCancel: () => void }) {
  const { settings } = useTrips();
  const [formData, setFormData] = useState<Partial<Trip>>(
    trip || {
      name: '',
      type: 'day',
      date: new Date().toISOString().split('T')[0],
      costs: { forecast: { ...DEFAULT_COSTS }, actual: undefined },
      status: 'forecast',
      notes: '',
      location: undefined,
    }
  );
  const [activeTab, setActiveTab] = useState<'forecast' | 'actual'>(
    trip?.costs.actual ? 'actual' : 'forecast'
  );
  const [locationSearch, setLocationSearch] = useState('');
  const [showLocationSearch, setShowLocationSearch] = useState(false);

  const handleCostChange = (field: keyof TripCosts, value: number) => {
    setFormData(prev => ({
      ...prev,
      costs: {
        ...prev.costs!,
        [activeTab]: {
          ...prev.costs![activeTab],
          [field]: value,
        },
      },
    }));
  };

  const handleLocationSelect = (location: Location) => {
    setFormData(prev => ({ ...prev, location }));
    setShowLocationSearch(false);
    setLocationSearch('');
  };

  const handleSubmit = () => {
    if (!formData.name?.trim()) return;

    const now = new Date().toISOString();
    const newTrip: Trip = {
      id: trip?.id || generateId(),
      name: formData.name!,
      type: formData.type || 'day',
      date: formData.date || now.split('T')[0],
      location: formData.location,
      costs: {
        forecast: formData.costs?.forecast || { ...DEFAULT_COSTS },
        actual: activeTab === 'actual' ? formData.costs?.actual : undefined,
      },
      status: formData.status || 'forecast',
      notes: formData.notes,
      createdAt: trip?.createdAt || now,
      updatedAt: now,
    };

    onSave(newTrip);
  };

  const calculateTotal = () => {
    const costs = formData.costs?.[activeTab] || DEFAULT_COSTS;
    return Object.values(costs).reduce((sum, val) => sum + val, 0);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">
          {trip ? 'Edit Trip' : 'New Trip'}
        </h2>
        <button onClick={onCancel} className="p-2 text-white/60 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Trip Type Selection */}
      <div className="flex gap-2">
        {(['day', 'road', 'overnight'] as TripType[]).map((type) => (
          <button
            key={type}
            onClick={() => setFormData(prev => ({ ...prev, type }))}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
              formData.type === type
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
            }`}
          >
            {getTripTypeIcon(type)}
            <span className="text-sm font-medium capitalize">{type}</span>
          </button>
        ))}
      </div>

      {/* Basic Info */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Trip Name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
        />
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
          className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary [color-scheme:dark]"
        />
      </div>

      {/* Location */}
      <div className="space-y-2">
        <label className="text-sm text-white/60">Location (Optional)</label>
        {formData.location ? (
          <div className="flex items-center justify-between bg-white/5 border border-white/15 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary" />
              <div>
                <p className="text-white font-medium">{formData.location.name}</p>
                {formData.location.address && (
                  <p className="text-xs text-white/50">{formData.location.address}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setFormData(prev => ({ ...prev, location: undefined }))}
              className="p-2 text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowLocationSearch(true)}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all"
          >
            <MapPin className="w-5 h-5" />
            <span>Add Location</span>
          </button>
        )}
        {formData.location?.thumbnailUrl && (
          <div className="rounded-lg overflow-hidden h-32">
            <img
              src={formData.location.thumbnailUrl}
              alt="Location"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Status */}
      <div className="flex gap-2">
        {(['forecast', 'active', 'completed'] as TripStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => setFormData(prev => ({ ...prev, status }))}
            className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border transition-all ${
              formData.status === status
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
            }`}
          >
            {status === 'forecast' && <Target className="w-4 h-4" />}
            {status === 'active' && <TrendingUp className="w-4 h-4" />}
            {status === 'completed' && <Check className="w-4 h-4" />}
            <span className="text-xs font-medium capitalize">{status}</span>
          </button>
        ))}
      </div>

      {/* Cost Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
        <button
          onClick={() => setActiveTab('forecast')}
          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg transition-all ${
            activeTab === 'forecast'
              ? 'bg-primary text-white'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Target className="w-4 h-4" />
          <span className="text-sm font-medium">Forecast</span>
        </button>
        <button
          onClick={() => setActiveTab('actual')}
          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg transition-all ${
            activeTab === 'actual'
              ? 'bg-green-500 text-white'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span className="text-sm font-medium">Actual</span>
        </button>
      </div>

      {/* Cost Inputs */}
      <div className="space-y-3">
        {(Object.keys(DEFAULT_COSTS) as (keyof TripCosts)[]).map((key) => (
          <div key={key} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/60">
              {getCostIcon(key)}
            </div>
            <label className="flex-1 text-sm text-white/80">{COST_LABELS[key]}</label>
            <input
              type="number"
              value={formData.costs?.[activeTab]?.[key] || 0}
              onChange={(e) => handleCostChange(key, parseFloat(e.target.value) || 0)}
              className="w-28 bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-right focus:outline-none focus:border-primary"
            />
          </div>
        ))}
      </div>

      {/* Total */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-white/60">{activeTab === 'forecast' ? 'Forecast' : 'Actual'} Total</span>
          <span className={`text-2xl font-bold ${activeTab === 'actual' ? 'text-green-400' : 'text-gradient'}`}>
            {settings.currencySymbol}{calculateTotal().toFixed(settings.decimalPlaces)}
          </span>
        </div>
      </GlassCard>

      {/* Notes */}
      <textarea
        placeholder="Notes (optional)"
        value={formData.notes}
        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
        className="w-full h-24 bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-primary resize-none"
      />

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 p-4 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!formData.name?.trim()}
          className="flex-1 p-4 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {trip ? 'Update Trip' : 'Save Trip'}
        </button>
      </div>

      {/* Location Search Modal */}
      {showLocationSearch && (
        <LocationSearchModal
          onSelect={handleLocationSelect}
          onClose={() => setShowLocationSearch(false)}
        />
      )}
    </div>
  );
}

// Location Search Modal
function LocationSearchModal({ onSelect, onClose }: { onSelect: (location: Location) => void; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);

  // Demo locations for search
  const demoLocations: Location[] = [
    { lat: 40.7128, lng: -74.006, name: 'New York City', address: 'New York, USA', thumbnailUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400' },
    { lat: 51.5074, lng: -0.1278, name: 'London', address: 'England, UK', thumbnailUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400' },
    { lat: 35.6762, lng: 139.6503, name: 'Tokyo', address: 'Japan', thumbnailUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400' },
    { lat: 48.8566, lng: 2.3522, name: 'Paris', address: 'France', thumbnailUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400' },
    { lat: 34.0522, lng: -118.2437, name: 'Los Angeles', address: 'California, USA', thumbnailUrl: 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=400' },
    { lat: 41.3851, lng: 2.1734, name: 'Barcelona', address: 'Spain', thumbnailUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400' },
    { lat: 52.3676, lng: 4.9041, name: 'Amsterdam', address: 'Netherlands', thumbnailUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400' },
    { lat: 37.7749, lng: -122.4194, name: 'San Francisco', address: 'California, USA', thumbnailUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400' },
    { lat: 13.7563, lng: 100.5018, name: 'Bangkok', address: 'Thailand', thumbnailUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400' },
    { lat: 1.3521, lng: 103.8198, name: 'Singapore', address: 'Singapore', thumbnailUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400' },
  ];

  const handleSearch = (query: string) => {
    setSearch(query);
    if (query.length > 1) {
      setLoading(true);
      // Filter demo locations
      const filtered = demoLocations.filter(loc =>
        loc.name.toLowerCase().includes(query.toLowerCase()) ||
        loc.address?.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setLoading(false);
    } else {
      setResults([]);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end">
      <div className="w-full bg-[#1a1a2e] rounded-t-3xl max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 text-white/60">
              <X className="w-5 h-5" />
            </button>
            <input
              type="text"
              placeholder="Search for a destination..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
              className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="overflow-y-auto max-h-[60vh] p-4 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-white/60">Searching...</div>
          ) : results.length > 0 ? (
            results.map((location, index) => (
              <button
                key={index}
                onClick={() => onSelect(location)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-left"
              >
                {location.thumbnailUrl && (
                  <img src={location.thumbnailUrl} alt={location.name} className="w-16 h-16 rounded-lg object-cover" />
                )}
                <div>
                  <p className="font-medium text-white">{location.name}</p>
                  {location.address && <p className="text-xs text-white/50">{location.address}</p>}
                </div>
              </button>
            ))
          ) : search.length > 1 ? (
            <div className="text-center py-8 text-white/60">No locations found</div>
          ) : (
            <div className="text-center py-8 text-white/40">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Search for a destination to add to your trip</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Home Page
function HomePage({ onAddTrip, onEditTrip }: { onAddTrip: () => void; onEditTrip: (trip: Trip) => void }) {
  const { trips, calculateGrandTotal, formatCurrency } = useTrips();

  const upcomingTrips = trips.filter(t => t.status !== 'completed').slice(0, 5);
  const recentTrips = trips.filter(t => t.status === 'completed').slice(0, 3);

  return (
    <div className="space-y-6 pb-24">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-white/60">Forecast</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(calculateGrandTotal('forecast'))}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-xs text-white/60">Actual</span>
          </div>
          <p className="text-xl font-bold text-green-400">{formatCurrency(calculateGrandTotal('actual'))}</p>
        </GlassCard>
      </div>

      {/* Upcoming Trips */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Upcoming Trips</h2>
          <span className="text-xs text-white/50">{upcomingTrips.length} trips</span>
        </div>
        {upcomingTrips.length > 0 ? (
          <div className="space-y-3">
            {upcomingTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onClick={() => onEditTrip(trip)} />
            ))}
          </div>
        ) : (
          <GlassCard className="p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-white/30" />
            <p className="text-white/60 mb-4">No upcoming trips</p>
            <button
              onClick={onAddTrip}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Plan a Trip</span>
            </button>
          </GlassCard>
        )}
      </div>

      {/* Recent Completed */}
      {recentTrips.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Recent Trips</h2>
            <span className="text-xs text-white/50">{recentTrips.length} completed</span>
          </div>
          <div className="space-y-3">
            {recentTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onClick={() => onEditTrip(trip)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Add/Edit Trip Page
function AddTripPage({ trip, onSave, onCancel }: { trip?: Trip; onSave: (trip: Trip) => void; onCancel: () => void }) {
  return (
    <div className="pb-24">
      <TripForm trip={trip} onSave={onSave} onCancel={onCancel} />
    </div>
  );
}

// History Page
function HistoryPage({ onEditTrip }: { onEditTrip: (trip: Trip) => void }) {
  const { trips, deleteTrip, formatCurrency, calculateTripTotal } = useTrips();

  const sortedTrips = [...trips].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalForecast = trips.reduce((sum, t) => sum + calculateTripTotal(t, 'forecast'), 0);
  const totalActual = trips.reduce((sum, t) => calculateTripTotal(t, 'actual') > 0 ? sum + calculateTripTotal(t, 'actual') : sum, 0);

  return (
    <div className="space-y-6 pb-24">
      {/* Summary */}
      <GlassCard className="p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-white/60 mb-1">Total Trips</p>
            <p className="text-xl font-bold text-white">{trips.length}</p>
          </div>
          <div>
            <p className="text-xs text-white/60 mb-1">Forecast</p>
            <p className="text-lg font-bold text-yellow-400">{formatCurrency(totalForecast)}</p>
          </div>
          <div>
            <p className="text-xs text-white/60 mb-1">Actual</p>
            <p className="text-lg font-bold text-green-400">{formatCurrency(totalActual)}</p>
          </div>
        </div>
      </GlassCard>

      {/* Trip List */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">All Trips</h2>
        {sortedTrips.length > 0 ? (
          <div className="space-y-3">
            {sortedTrips.map((trip) => {
              const forecastTotal = calculateTripTotal(trip, 'forecast');
              const actualTotal = calculateTripTotal(trip, 'actual');

              return (
                <GlassCard key={trip.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`trip-badge trip-badge-${trip.type === 'day' ? 'day' : trip.type === 'road' ? 'road' : 'overnight'}`}>
                          {getTripTypeIcon(trip.type)}
                          <span className="capitalize">{trip.type}</span>
                        </span>
                        <span className={`status-dot ${
                          trip.status === 'forecast' ? 'status-forecast' :
                          trip.status === 'active' ? 'status-active' :
                          'status-completed'
                        }`} />
                      </div>
                      <h3 className="font-semibold text-white">{trip.name}</h3>
                      <p className="text-xs text-white/50">{formatDate(trip.date)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEditTrip(trip)}
                        className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this trip?')) deleteTrip(trip.id);
                        }}
                        className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {trip.location && (
                    <div className="flex items-center gap-2 text-xs text-white/50 mb-3">
                      <MapPin className="w-3 h-3" />
                      {trip.location.name}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm pt-3 border-t border-white/10">
                    <div>
                      <span className="text-white/60">Budget: </span>
                      <span className="font-semibold text-white">{formatCurrency(forecastTotal)}</span>
                    </div>
                    {actualTotal > 0 && (
                      <div>
                        <span className="text-white/60">Spent: </span>
                        <span className={`font-semibold ${actualTotal > forecastTotal ? 'text-red-400' : 'text-green-400'}`}>
                          {formatCurrency(actualTotal)}
                        </span>
                      </div>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        ) : (
          <GlassCard className="p-8 text-center">
            <History className="w-12 h-12 mx-auto mb-3 text-white/30" />
            <p className="text-white/60">No trips yet</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

// Settings Page
function SettingsPage() {
  const { settings, updateSettings, exportToJSON, exportToCSV, formatCurrency, calculateGrandTotal } = useTrips();

  const handleExportJSON = () => {
    const data = exportToJSON();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `violet-voyage-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const data = exportToCSV();
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `violet-voyage-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Settings */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Settings</h2>
        <GlassCard className="p-4 space-y-4">
          {/* Currency */}
          <div>
            <label className="text-sm text-white/60 mb-2 block">Currency</label>
            <div className="grid grid-cols-5 gap-2">
              {CURRENCIES.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => updateSettings({ currency: currency.code, currencySymbol: currency.symbol })}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    settings.currency === currency.code
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                  }`}
                >
                  <span className="text-lg font-bold">{currency.symbol}</span>
                  <span className="text-xs block opacity-60">{currency.code}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Decimal Places */}
          <div>
            <label className="text-sm text-white/60 mb-2 block">Decimal Places</label>
            <div className="flex gap-2">
              {[0, 2].map((decimals) => (
                <button
                  key={decimals}
                  onClick={() => updateSettings({ decimalPlaces: decimals })}
                  className={`flex-1 p-3 rounded-xl border transition-all ${
                    settings.decimalPlaces === decimals
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                  }`}
                >
                  {decimals} decimals
                </button>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Export */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Export Data</h2>
        <GlassCard className="p-4 space-y-4">
          <p className="text-sm text-white/60">
            Export your trip data for analysis in other apps or as a backup.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExportJSON}
              className="flex items-center justify-center gap-2 p-4 rounded-xl bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-all"
            >
              <Download className="w-5 h-5" />
              <span>JSON</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-2 p-4 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-all"
            >
              <Download className="w-5 h-5" />
              <span>CSV</span>
            </button>
          </div>
        </GlassCard>
      </div>

      {/* Summary Stats */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Statistics</h2>
        <GlassCard className="p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Total Forecast</span>
            <span className="font-semibold text-yellow-400">{formatCurrency(calculateGrandTotal('forecast'))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Total Actual</span>
            <span className="font-semibold text-green-400">{formatCurrency(calculateGrandTotal('actual'))}</span>
          </div>
        </GlassCard>
      </div>

      {/* About */}
      <div className="text-center text-xs text-white/30 py-4">
        <p>Violet Voyage v1.0</p>
        <p>Trip Planner & Expense Tracker</p>
      </div>
    </div>
  );
}

// Main App
function App() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [editingTrip, setEditingTrip] = useState<Trip | undefined>();

  // Load from localStorage
  useEffect(() => {
    const savedTrips = localStorage.getItem('violet_voyage_trips');
    const savedSettings = localStorage.getItem('violet_voyage_settings');
    if (savedTrips) setTrips(JSON.parse(savedTrips));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('violet_voyage_trips', JSON.stringify(trips));
      localStorage.setItem('violet_voyage_settings', JSON.stringify(settings));
    }
  }, [trips, settings, isLoaded]);

  const addTrip = (trip: Trip) => {
    setTrips(prev => [trip, ...prev]);
    setCurrentPage('home');
    setEditingTrip(undefined);
  };

  const updateTrip = (id: string, updates: Partial<Trip>) => {
    setTrips(prev =>
      prev.map(trip =>
        trip.id === id ? { ...trip, ...updates, updatedAt: new Date().toISOString() } : trip
      )
    );
    setCurrentPage('home');
    setEditingTrip(undefined);
  };

  const deleteTrip = (id: string) => {
    setTrips(prev => prev.filter(trip => trip.id !== id));
  };

  const getTrip = (id: string) => trips.find(trip => trip.id === id);

  const calculateTripTotal = (trip: Trip, type: 'forecast' | 'actual' = 'forecast') => {
    const costs = type === 'actual' && trip.costs.actual ? trip.costs.actual : trip.costs.forecast;
    return Object.values(costs).reduce((sum, amount) => sum + amount, 0);
  };

  const calculateGrandTotal = (type: 'forecast' | 'actual' = 'forecast') => {
    return trips.reduce((total, trip) => total + calculateTripTotal(trip, type), 0);
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const formatCurrency = (amount: number) => {
    return `${settings.currencySymbol}${amount.toFixed(settings.decimalPlaces)}`;
  };

  const exportToJSON = () => {
    const data = { trips, settings, exportedAt: new Date().toISOString(), version: '1.0' };
    return JSON.stringify(data, null, 2);
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Type', 'Date', 'Status', 'Location', 'Forecast Total', 'Actual Total'];
    const rows = trips.map(trip => [
      trip.id,
      `"${trip.name}"`,
      trip.type,
      trip.date,
      trip.status,
      trip.location?.name || '',
      calculateTripTotal(trip, 'forecast'),
      calculateTripTotal(trip, 'actual'),
    ]);
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  const store: TripStore = {
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

  const handleAddTrip = () => {
    setEditingTrip(undefined);
    setCurrentPage('add');
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setCurrentPage('add');
  };

  const handleSaveTrip = (trip: Trip) => {
    if (editingTrip) {
      updateTrip(trip.id, trip);
    } else {
      addTrip(trip);
    }
  };

  const handleCancel = () => {
    setCurrentPage('home');
    setEditingTrip(undefined);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <TripContext.Provider value={store}>
      <div className="min-h-screen pb-20">
        <Header />
        <main className="px-4 pt-4">
          {currentPage === 'home' && (
            <HomePage onAddTrip={handleAddTrip} onEditTrip={handleEditTrip} />
          )}
          {currentPage === 'add' && (
            <AddTripPage trip={editingTrip} onSave={handleSaveTrip} onCancel={handleCancel} />
          )}
          {currentPage === 'history' && (
            <HistoryPage onEditTrip={handleEditTrip} />
          )}
          {currentPage === 'settings' && (
            <SettingsPage />
          )}
        </main>
        <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
      </div>
    </TripContext.Provider>
  );
}

export default App;
