import type { Level } from "../types";

export const LEVEL_COLORS = ["#5b9a3c", "#d9b62a", "#e8822a", "#d0433a", "#7d4fb3"];
export const LEVEL_NAMES = ["Low", "Moderate", "High", "Severe", "No travel"];
export const NO_DATA_COLOR = "#9aa0a6";

export const levelColor = (l: Level | null) => (l === null ? NO_DATA_COLOR : LEVEL_COLORS[l]);
export const levelName = (l: Level | null) => (l === null ? "No forecast" : LEVEL_NAMES[l]);

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
