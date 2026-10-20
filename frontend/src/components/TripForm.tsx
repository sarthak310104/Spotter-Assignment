import { useState, type FormEvent } from "react";
import { DESTINATION_COLOR, nextHourLocal, ORIGIN_COLOR } from "../lib/format";
import { displayToLb, intervalLabel, lbToDisplay, loadUnit, unitsFor } from "../lib/units";
import type { Interval, Place, Region, TripInput } from "../types";
import { PlaceInput } from "./PlaceInput";
import styles from "./TripForm.module.css";

type Props = {
  loading: boolean;
  regions: Region[];
  regionId: string;
  onRegionChange: (id: string) => void;
  onSubmit: (t: TripInput) => void;
};

export function TripForm({ loading, regions, regionId, onRegionChange, onSubmit }: Props) {
  const [origin, setOrigin] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [departure, setDeparture] = useState(nextHourLocal());
  const [loadLb, setLoadLb] = useState(40000);
  const [interval, setIntervalMi] = useState<Interval>(25);
  const region = regions.find((r) => r.id === regionId);
  const units = unitsFor(origin, destination, region?.units ?? "imperial");
  const ready = origin && destination && loadLb > 0;

  function submit(intervalMi = interval) {
    if (!origin || !destination) return;
    onSubmit({
      origin,
      destination,
      departure: new Date(departure).toISOString(),
      loadLb,
      intervalMi,
      units,
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submit();
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span>Region</span>
        <select
          value={regionId}
          onChange={(e) => {
            setOrigin(null);
            setDestination(null);
            onRegionChange(e.target.value);
          }}
        >
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>

      {/* key remounts the inputs so their text clears when the region changes */}
      <PlaceInput
        key={`from-${regionId}`}
        label="From"
        color={ORIGIN_COLOR}
        region={regionId}
        value={origin}
        onChange={setOrigin}
      />
      <PlaceInput
        key={`to-${regionId}`}
        label="To"
        color={DESTINATION_COLOR}
        region={regionId}
        value={destination}
        onChange={setDestination}
      />
      <p className={styles.hint}>
        {units === "metric" ? "Showing km and kg" : "Showing miles and lb"}
        {origin && destination
          ? units === "metric"
            ? ", both places use metric"
            : ", one or both places use imperial"
          : ` for ${region?.name ?? "this region"}`}
      </p>

      <div className={styles.row}>
        <label className={styles.field}>
          <span>Leave at</span>
          <input
            type="datetime-local"
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>Load ({loadUnit(units)})</span>
          {/* load is kept in lb, the risk rules use lb */}
          <input
            type="number"
            min={1}
            step={1}
            value={Math.round(lbToDisplay(loadLb, units))}
            onChange={(e) => setLoadLb(displayToLb(Number(e.target.value), units))}
          />
        </label>
      </div>

      <label className={styles.field}>
        <span>Check weather every</span>
        <select
          value={interval}
          onChange={(e) => {
            const v = Number(e.target.value) as Interval;
            setIntervalMi(v);
            if (ready) submit(v);
          }}
        >
          {[10, 25, 50].map((mi) => (
            <option key={mi} value={mi}>
              {intervalLabel(mi, units)}
            </option>
          ))}
        </select>
      </label>

      <button type="submit" disabled={!ready || loading}>
        {loading ? "Finding routes..." : "Find routes"}
      </button>
    </form>
  );
}