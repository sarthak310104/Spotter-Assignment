import { useState, type FormEvent } from "react";
import { DESTINATION_COLOR, nextHourLocal, ORIGIN_COLOR } from "../lib/format";
import type { Interval, Place, TripInput } from "../types";
import { PlaceInput } from "./PlaceInput";
import styles from "./TripForm.module.css";

type Props = { loading: boolean; onSubmit: (t: TripInput) => void };

export function TripForm({ loading, onSubmit }: Props) {
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
      <PlaceInput label="From" color={ORIGIN_COLOR} value={origin} onChange={setOrigin} />
      <PlaceInput label="To" color={DESTINATION_COLOR} value={destination} onChange={setDestination} />

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