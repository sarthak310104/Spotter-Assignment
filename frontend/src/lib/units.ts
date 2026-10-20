import type { Place, Units } from "../types";

// countries whose roads use miles and mph; everyone else here is metric
const IMPERIAL = new Set(["USA", "GBR", "LBR", "MMR"]);

const KM_PER_MI = 1.609344;
const KG_PER_LB = 0.45359237;

// metric only when both ends are metric, so a USA <-> CAN trip stays in miles and lb
export function unitsFor(origin: Place | null, destination: Place | null, fallback: Units): Units {
  const countries = [origin?.country, destination?.country];
  if (countries.some((c) => !c)) return fallback;
  return countries.some((c) => IMPERIAL.has(c!)) ? "imperial" : "metric";
}

export const lbToDisplay = (lb: number, u: Units) => (u === "metric" ? lb * KG_PER_LB : lb);
export const displayToLb = (v: number, u: Units) => (u === "metric" ? v / KG_PER_LB : v);
export const loadUnit = (u: Units) => (u === "metric" ? "kg" : "lb");

export function distance(mi: number, u: Units) {
  return u === "metric" ? `${Math.round(mi * KM_PER_MI)} km` : `${Math.round(mi)} mi`;
}

export function marker(mi: number, u: Units) {
  return u === "metric" ? `Km ${Math.round(mi * KM_PER_MI)}` : `Mile ${Math.round(mi)}`;
}

// 10/25/50 mi from the brief shown as rounded km
export function intervalLabel(mi: number, u: Units) {
  return u === "metric" ? `${Math.round(mi * KM_PER_MI)} km` : `${mi} miles`;
}

export function weatherLine(w: { wind_mph: number; rain_in: number; snow_in: number }, u: Units) {
  if (u === "metric") {
    const wind = Math.round(w.wind_mph * KM_PER_MI);
    const rain = (w.rain_in * 25.4).toFixed(1);
    const snow = (w.snow_in * 2.54).toFixed(1);
    return `Wind ${wind} km/h, rain ${rain} mm/hr, snow ${snow} cm/hr`;
  }
  return `Wind ${Math.round(w.wind_mph)} mph, rain ${w.rain_in.toFixed(2)} in/hr, snow ${w.snow_in.toFixed(1)} in/hr`;
}