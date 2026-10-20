export type Place = { label: string; lat: number; lng: number; country?: string | null };

export type Units = "imperial" | "metric";

export type Region = { id: string; name: string; center: [number, number]; zoom: number; units: Units }; // center is [lat, lng]

export type Level = 0 | 1 | 2 | 3 | 4;

export type Weather = { wind_mph: number; rain_in: number; snow_in: number };

export type Checkpoint = {
  lat: number;
  lng: number;
  mile: number;
  eta: number; // unix seconds
  weather: Weather | null;
  level: Level | null;
  driver: "wind" | "rain" | "snow" | null;
};

export type RouteSummary = {
  miles_by_level: number[];
  unknown_mi: number;
  avg_risk: number;
  distance_mi: number;
  duration_s: number;
  roads: string[];
};

export type RouteOption = {
  id: string;
  geometry: [number, number][]; // [lng, lat]
  checkpoints: Checkpoint[];
  summary: RouteSummary;
};

export type Plan = {
  recommended: string;
  routes: RouteOption[];
  corridor: [number, number][]; // [lat, lng]
};

export type Heatmap = {
  size: number;
  start: number;
  cells: [number, number][];
  levels: number[][]; // [hour][cell], -1 when no forecast
  scores: number[][];
  weather: ([number, number, number] | null)[][]; // [hour][cell] as [wind_mph, rain_in, snow_in]
  drivers: ("wind" | "rain" | "snow" | null)[][];
};

export type Interval = 10 | 25 | 50;

export type TripInput = {
  origin: Place;
  destination: Place;
  departure: string;
  loadLb: number;
  interval: Interval; // in the trip's units: miles, or km for metric
  units: Units; // display only, the backend always works in mi, mph, in and lb
};