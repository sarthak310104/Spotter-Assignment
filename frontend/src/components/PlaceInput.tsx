import { useState } from "react";
import { usePlaceSearch } from "../hooks/usePlaceSearch";
import type { Place } from "../types";
import styles from "./TripForm.module.css";

type Props = {
  label: string;
  color: string;
  value: Place | null;
  onChange: (p: Place | null) => void;
};

export function PlaceInput({ label, color, value, onChange }: Props) {
  const [text, setText] = useState(value?.label ?? "");
  const [open, setOpen] = useState(false);
  const results = usePlaceSearch(text, open && !value);

  return (
    <label className={styles.field}>
      <span className={styles.labelRow}>
        <i className={styles.pin} style={{ background: color, color }} />
        {label}
      </span>
      <div className={styles.suggestWrap}>
        <input
          value={text}
          placeholder="City or address"
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            if (value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {open && results.length > 0 && (
          <ul className={styles.suggestions}>
            {results.map((p) => (
              <li
                key={`${p.lat},${p.lng}`}
                onMouseDown={() => {
                  onChange(p);
                  setText(p.label);
                  setOpen(false);
                }}
              >
                {p.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </label>
  );
}