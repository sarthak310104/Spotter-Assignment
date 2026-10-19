import { useEffect, useState } from "react";
import { clock } from "../lib/format";
import styles from "./ForecastSlider.module.css";

type Props = {
  start: number | null;
  hour: number;
  onChange: (h: number) => void;
};

const MAX_HOUR = 48;

export function ForecastSlider({ start, hour, onChange }: Props) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => onChange((hour + 1) % (MAX_HOUR + 1)), 400);
    return () => clearInterval(t);
  }, [playing, hour, onChange]);

  const disabled = start === null;

  return (
    <div className={styles.bar}>
      <button disabled={disabled} onClick={() => setPlaying((p) => !p)}>
        {playing ? "Pause" : "Play"}
      </button>
      <input
        type="range"
        min={0}
        max={MAX_HOUR}
        step={1}
        value={hour}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className={styles.time}>
        {disabled ? "Plan a trip to see the forecast" : `${clock(start + hour * 3600)} (+${hour}h)`}
      </span>
    </div>
  );
}