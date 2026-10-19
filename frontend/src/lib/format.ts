import type { Checkpoint, Level } from "../types";

export const LEVEL_COLORS = ["#3fa34d", "#f2c230", "#f28a1c", "#e0362c", "#8b3fc6"];
export const LEVEL_NAMES = ["Low", "Moderate", "High", "Severe", "No travel"];
export const NO_DATA_COLOR = "#a7b0ba";

// route line colors, picked to stay clear of the risk palette
export const ROUTE_COLORS = ["#4d8dff", "#22c3d6", "#ff5fae"];
export const ORIGIN_COLOR = "#00704a";
export const DESTINATION_COLOR = "#c8102e";

export const levelColor = (l: Level | null) => (l === null ? NO_DATA_COLOR : LEVEL_COLORS[l]);
export const levelName = (l: Level | null) => (l === null ? "No forecast" : LEVEL_NAMES[l]);
export const routeColor = (index: number) => ROUTE_COLORS[index % ROUTE_COLORS.length];

// stretches between checkpoints, each at the worse level of its two ends
export function riskStretches(cps: Checkpoint[]) {
  return cps.slice(1).map((b, i) => {
    const a = cps[i];
    const level = a.level === null || b.level === null ? null : (Math.max(a.level, b.level) as Level);
    return { miles: b.mile - a.mile, level };
  });
}

export function duration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? `${h} h ${m} min` : `${m} min`;
}

export function clock(unix: number) {
  return new Date(unix * 1000).toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

// datetime-local wants "YYYY-MM-DDTHH:mm" in local time
export function nextHourLocal() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
}