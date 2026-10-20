import { useEffect, useState } from "react";
import { fetchRegions } from "../lib/api";
import type { Region } from "../types";

// used until the backend list loads, or if it fails
const FALLBACK: Region = { id: "us", name: "United States", center: [39.8, -98.6], zoom: 3.6 };

export function useRegions() {
  const [regions, setRegions] = useState<Region[]>([FALLBACK]);
  const [regionId, setRegionId] = useState(FALLBACK.id);

  useEffect(() => {
    fetchRegions()
      .then((r) => {
        setRegions(r.regions);
        setRegionId(r.default);
      })
      .catch(() => {});
  }, []);

  const region = regions.find((r) => r.id === regionId) ?? FALLBACK;
  return { regions, region, setRegionId };
}