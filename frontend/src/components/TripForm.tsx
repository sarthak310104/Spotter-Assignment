import { useState, type FormEvent } from "react";
import { DESTINATION_COLOR, nextHourLocal, ORIGIN_COLOR } from "../lib/format";
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
  const ready = origin && destination && loadLb > 0;

  function submit(intervalMi = interval) {
    if (!origin || !destination) return;
    onSubmit({
      origin,
      destination,
      departure: new Date(departure).toISOString(),
      loadLb,
      intervalMi,
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
          <span>Load (lb)</span>
          <input
            type="number"
            min={1}
            step={1}
            value={loadLb}
            onChange={(e) => setLoadLb(Number(e.target.value))}
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
          <option value={10}>10 miles</option>
          <option value={25}>25 miles</option>
          <option value={50}>50 miles</option>
        </select>
      </label>

      <button type="submit" disabled={!ready || loading}>
        {loading ? "Finding routes..." : "Find routes"}
      </button>
    </form>
  );
}