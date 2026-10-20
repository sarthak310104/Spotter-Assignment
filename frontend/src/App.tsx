import { useEffect, useState } from "react";
import { ForecastSlider } from "./components/ForecastSlider";
import { MapView } from "./components/MapView";
import { RouteList } from "./components/RouteList";
import { TripForm } from "./components/TripForm";
import { useRegions } from "./hooks/useRegions";
import { useTrip } from "./hooks/useTrip";
import type { TripInput, Units } from "./types";
import styles from "./App.module.css";

export default function App() {
  const { plan, heatmap, loading, error, run, reset } = useTrip();
  const { regions, region, setRegionId } = useRegions();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hour, setHour] = useState(0);
  const [units, setUnits] = useState<Units>("imperial"); // units of the trip on screen

  useEffect(() => {
    setSelectedId(plan?.recommended ?? null);
  }, [plan]);

  function planTrip(input: TripInput) {
    setUnits(input.units);
    run(input);
  }

  function changeRegion(id: string) {
    setRegionId(id);
    reset();
    setHour(0);
  }

  return (
    <div className={styles.app}>
      <aside className={styles.panel}>
        <header className={styles.sign}>
          <h1>Truck weather routing</h1>
          <p>Safest route for your load and departure time</p>
        </header>
        <TripForm
          loading={loading}
          regions={regions}
          regionId={region.id}
          onRegionChange={changeRegion}
          onSubmit={planTrip}
        />
        {error && <p className={styles.error}>{error}</p>}
        {plan && (
          <RouteList
            routes={plan.routes}
            recommended={plan.recommended}
            selectedId={selectedId}
            onSelect={setSelectedId}
            units={units}
          />
        )}
      </aside>
      <main className={styles.main}>
        <MapView
          plan={plan}
          region={region}
          units={units}
          selectedId={selectedId}
          onSelect={setSelectedId}
          heatmap={heatmap}
          hour={hour}
        />
        <ForecastSlider start={heatmap?.start ?? null} hour={hour} onChange={setHour} />
      </main>
    </div>
  );
}