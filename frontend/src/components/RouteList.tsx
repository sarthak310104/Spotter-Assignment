import { duration, levelColor, levelName, riskStretches, routeColor } from "../lib/format";
import type { RouteOption } from "../types";
import { RoadShield } from "./RoadShield";
import styles from "./RouteList.module.css";

type Props = {
  routes: RouteOption[];
  recommended: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function riskLine(miles: number[]) {
  const [, , high, severe, noTravel] = miles.map(Math.round);
  if (noTravel) return `${noTravel} mi in no-travel weather`;
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
      {ordered.map((r) => {
        const s = r.summary;
        const color = routeColor(routes.indexOf(r));
        const selected = r.id === selectedId;
        return (
          <li
            key={r.id}
            className={selected ? styles.selected : undefined}
            style={{ borderLeftColor: color }}
            tabIndex={0}
            onClick={() => onSelect(r.id)}
            onKeyDown={(e) => e.key === "Enter" && onSelect(r.id)}
          >
            {r.id === recommended && <div className={styles.best}>Recommended</div>}
            <div className={styles.top}>
              <span className={styles.roads}>
                {s.roads.length ? s.roads.map((name) => <RoadShield key={name} name={name} />) : "Route"}
              </span>
              <span className={styles.time}>{duration(s.duration_s)}</span>
            </div>

            <div className={styles.strip} aria-hidden>
              {riskStretches(r.checkpoints).map((st, i) => (
                <span
                  key={i}
                  style={{ flexGrow: st.miles, background: levelColor(st.level) }}
                  title={`${levelName(st.level)}, ${Math.round(st.miles)} mi`}
                />
              ))}
            </div>

            <div className={styles.meta}>
              <span>{Math.round(s.distance_mi)} mi</span>
              <span className={s.miles_by_level[4] || s.miles_by_level[3] ? styles.warn : undefined}>
                {riskLine(s.miles_by_level)}
              </span>
            </div>
            {s.unknown_mi > 0 && (
              <div className={styles.note}>{Math.round(s.unknown_mi)} mi past forecast range</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}