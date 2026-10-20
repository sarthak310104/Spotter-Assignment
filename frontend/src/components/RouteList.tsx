import { duration, levelColor, levelName, riskStretches, routeColor } from "../lib/format";
import { distance } from "../lib/units";
import type { RouteOption, Units } from "../types";
import { RoadShield } from "./RoadShield";
import styles from "./RouteList.module.css";

type Props = {
  routes: RouteOption[];
  recommended: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  units: Units;
};

function riskLine(miles: number[], u: Units) {
  const [, , high, severe, noTravel] = miles;
  const unit = u === "metric" ? "km" : "miles";
  if (noTravel) return `${distance(noTravel, u)} in no-travel weather`;
  if (severe) return `${distance(severe, u)} severe, ${distance(high, u)} high`;
  if (high) return `No severe ${unit}, ${distance(high, u)} high`;
  return `No severe or high ${unit}`;
}

export function RouteList({ routes, recommended, selectedId, onSelect, units }: Props) {
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
                  title={`${levelName(st.level)}, ${distance(st.miles, units)}`}
                />
              ))}
            </div>

            <div className={styles.meta}>
              <span>{distance(s.distance_mi, units)}</span>
              <span className={s.miles_by_level[4] || s.miles_by_level[3] ? styles.warn : undefined}>
                {riskLine(s.miles_by_level, units)}
              </span>
            </div>
            {s.unknown_mi > 0 && (
              <div className={styles.note}>{distance(s.unknown_mi, units)} past forecast range</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}