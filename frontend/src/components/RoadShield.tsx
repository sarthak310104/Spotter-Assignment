import styles from "./RoadShield.module.css";

// "I-35" gets the red/blue interstate shield, "US-287" the white US shield, anything else a plain plate
export function RoadShield({ name }: { name: string }) {
  const interstate = name.match(/^I[- ]?(\d+\w*)$/i);
  if (interstate) {
    return (
      <span className={styles.interstate} title={name}>
        <span className={styles.cap} />
        <span className={styles.num}>{interstate[1]}</span>
      </span>
    );
  }
  const us = name.match(/^US[- ]?(\d+\w*)$/i);
  if (us) {
    return (
      <span className={styles.us} title={name}>
        {us[1]}
      </span>
    );
  }
  return <span className={styles.plate}>{name}</span>;
}