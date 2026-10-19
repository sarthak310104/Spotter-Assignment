import { duration } from "../lib/format";
import type { RouteOption } from "../types";
import styles from "./RouteList.module.css";

type Props = {
  routes: RouteOption[];
  recommended: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function riskLine(miles: number[]) {
  const [, , high, severe, noTravel] = miles.map(Math.round);
  if (noTravel) return `${noTravel} mi no-travel weather`;
  if (severe) return `${severe} mi severe, ${high} mi high`;
  if (high) return `No severe miles, ${high} mi high`;
  return "No severe or high miles";
}

export function RouteList({ routes, recommended, selectedId, onSelect }: Props) {
  const ordered = [...routes].sort((a, b) =>
    a.id === recommended ? -1 : b.id === recommended ? 1 : 0,
  );

  return (
    <ul className={styles.list}>
      {ordered.map((r, i) => {
        const s = r.summary;
        const name = s.roads.length ? `Via ${s.roads.join(", ")}` : `Route ${i + 1}`;
        return (
          <li
            key={r.id}
            className={r.id === selectedId ? styles.selected : undefined}
            onClick={() => onSelect(r.id)}
          >
            <div className={styles.top}>
              <span className={styles.name}>{name}</span>
              <span>{duration(s.duration_s)}</span>
            </div>
            <div className={styles.sub}>{Math.round(s.distance_mi)} mi</div>
            <div className={s.miles_by_level[4] ? styles.warn : styles.sub}>
              {riskLine(s.miles_by_level)}
            </div>
            {s.unknown_mi > 0 && (
              <div className={styles.sub}>{Math.round(s.unknown_mi)} mi past forecast range</div>
            )}
            {r.id === recommended && <div className={styles.best}>Recommended</div>}
          </li>
        );
      })}
    </ul>
  );
}
