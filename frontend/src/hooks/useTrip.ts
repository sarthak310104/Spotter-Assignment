import { useCallback, useRef, useState } from "react";
import { fetchHeatmap, fetchPlan } from "../lib/api";
import type { Heatmap, Plan, TripInput } from "../types";

export function useTrip() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [heatmap, setHeatmap] = useState<Heatmap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const runId = useRef(0); // ignores responses from older submits

  const run = useCallback(async (input: TripInput) => {
    const id = ++runId.current;
    setLoading(true);
    setError(null);
    try {
      const p = await fetchPlan(input);
      if (id !== runId.current) return;
      setPlan(p);
      setLoading(false);
      // routes show first, the heatmap fills in after
      const h = await fetchHeatmap(p.corridor, input.departure, input.loadLb);
      if (id === runId.current) setHeatmap(h);
    } catch (e) {
      if (id !== runId.current) return;
      setError((e as Error).message);
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    runId.current++;
    setPlan(null);
    setHeatmap(null);
    setError(null);
    setLoading(false);
  }, []);

  return { plan, heatmap, loading, error, run, reset };
}