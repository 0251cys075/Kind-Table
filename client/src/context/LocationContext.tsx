import React, { createContext, useContext, useState } from 'react';

export interface LocationDistrict {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
}

export const CITY_DISTRICTS: LocationDistrict[] = [
  {
    id: 'central',
    name: 'Central Campus & Downtown',
    description: 'High Meadow, Main Hall, City Center',
    lat: 40.7128,
    lng: -74.0060,
  },
  {
    id: 'west',
    name: 'West End & University',
    description: 'Campus West Counter, Hope Avenue',
    lat: 40.7282,
    lng: -73.9942,
  },
  {
    id: 'north',
    name: 'North Market & Riverfront',
    description: 'Harbor Docks, Organic Food Exchange',
    lat: 40.7350,
    lng: -74.0100,
  },
  {
    id: 'south',
    name: 'South Bay & Shelter Hub',
    description: 'Community Kitchen, Shelter Network',
    lat: 40.7020,
    lng: -74.0150,
  },
  {
    id: 'uptown',
    name: 'Uptown & Medical Quarter',
    description: 'Hospital Canteen, Volunteer Station',
    lat: 40.7484,
    lng: -73.9857,
  },
];

interface LocationContextType {
  currentLocation: LocationDistrict;
  maxDistanceKm: number | null; // null = all
  districts: LocationDistrict[];
  setCurrentLocation: (loc: LocationDistrict) => void;
  setMaxDistanceKm: (dist: number | null) => void;
  getDistanceKm: (lat?: number, lng?: number) => number | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<LocationDistrict>(CITY_DISTRICTS[0]);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | null>(null);

  const getDistanceKm = (lat?: number, lng?: number): number | null => {
    if (lat == null || lng == null) return null;
    const R = 6371; // km
    const dLat = ((lat - currentLocation.lat) * Math.PI) / 180;
    const dLon = ((lng - currentLocation.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((currentLocation.lat * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        maxDistanceKm,
        districts: CITY_DISTRICTS,
        setCurrentLocation,
        setMaxDistanceKm,
        getDistanceKm,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return ctx;
};
