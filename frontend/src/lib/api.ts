import type { Heatmap, Place, Plan, Region, TripInput } from "../types";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api/${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body.detail ?? Object.values(body).flat().join(", ");
    throw new Error(msg || `Request failed (${res.status})`);
  }
  return body as T;
}

export const fetchRegions = () => request<{ default: string; regions: Region[] }>("regions/");

export const searchPlaces = (q: string, region: string, signal?: AbortSignal) =>
  request<Place[]>(`places/?q=${encodeURIComponent(q)}&region=${region}`, { signal });

export const fetchPlan = (t: TripInput) =>
  request<Plan>("plan/", {
    method: "POST",
    body: JSON.stringify({
      origin: t.origin,
      destination: t.destination,
      departure: t.departure,
      load_lb: t.loadLb,
      interval: t.interval,
      interval_unit: t.units === "metric" ? "km" : "mi",
    }),
  });

export const fetchHeatmap = (corridor: Plan["corridor"], departure: string, loadLb: number) =>
  request<Heatmap>("heatmap/", {
    method: "POST",
    body: JSON.stringify({ corridor, departure, load_lb: loadLb }),
  });