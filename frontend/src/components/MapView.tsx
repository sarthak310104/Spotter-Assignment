import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { type GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  clock,
  DESTINATION_COLOR,
  LEVEL_COLORS,
  LEVEL_NAMES,
  levelColor,
  levelName,
  ORIGIN_COLOR,
  routeColor,
} from "../lib/format";
import type { Heatmap, Plan, Region } from "../types";
import styles from "./MapView.module.css";

const STYLE_URL = "https://tiles.openfreemap.org/styles/dark";
const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

type Props = {
  plan: Plan | null;
  region: Region;
  selectedId: string | null;
  onSelect: (id: string) => void;
  heatmap: Heatmap | null;
  hour: number;
};

// one FeatureCollection per forecast hour, built once so the slider only swaps data
function heatFrames(hm: Heatmap): GeoJSON.FeatureCollection[] {
  const half = (hm.size * 0.92) / 2;
  return hm.levels.map((row, h) => ({
    type: "FeatureCollection",
    features: row.flatMap((level, i) => {
      if (level <= 0) return [];
      const [lat, lng] = hm.cells[i];
      return [
        {
          type: "Feature",
          properties: {
            color: LEVEL_COLORS[level],
            height: 4000 + hm.scores[h][i] * 45000,
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [lng - half, lat - half],
              [lng + half, lat - half],
              [lng + half, lat + half],
              [lng - half, lat + half],
              [lng - half, lat - half],
            ]],
          },
        } as GeoJSON.Feature,
      ];
    }),
  }));
}

function setData(map: maplibregl.Map, id: string, data: GeoJSON.FeatureCollection) {
  (map.getSource(id) as GeoJSONSource | undefined)?.setData(data);
}

export function MapView({ plan, region, selectedId, onSelect, heatmap, hour }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const selectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  selectRef.current = onSelect;

  useEffect(() => {
    const map = new maplibregl.Map({
      container: box.current!,
      style: STYLE_URL,
      center: [region.center[1], region.center[0]],
      zoom: region.zoom,
      pitch: 45,
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    map.on("load", () => {
      map.addSource("heat", { type: "geojson", data: EMPTY });
      map.addSource("routes", { type: "geojson", data: EMPTY });
      map.addSource("checkpoints", { type: "geojson", data: EMPTY });

      map.addLayer({
        id: "heat",
        type: "fill-extrusion",
        source: "heat",
        paint: {
          "fill-extrusion-color": ["get", "color"],
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-opacity": 0.8,
        },
      });
      // dark edge under the selected route so it reads over the weather columns
      map.addLayer({
        id: "routes-casing",
        type: "line",
        source: "routes",
        filter: ["==", ["get", "selected"], true],
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#0d1116", "line-width": 10 },
      });
      map.addLayer({
        id: "routes",
        type: "line",
        source: "routes",
        layout: {
          "line-join": "round",
          "line-cap": "round",
          "line-sort-key": ["case", ["get", "selected"], 1, 0],
        },
        paint: {
          "line-color": ["get", "color"],
          "line-width": ["case", ["get", "selected"], 6, 3.5],
          "line-opacity": ["case", ["get", "selected"], 1, 0.75],
        },
      });
      map.addLayer({
        id: "checkpoints",
        type: "circle",
        source: "checkpoints",
        paint: {
          "circle-radius": 5,
          "circle-color": ["get", "color"],
          "circle-stroke-color": "#0d1116",
          "circle-stroke-width": 1.5,
        },
      });

      map.on("click", "routes", (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (id) selectRef.current(id);
      });
      map.on("click", "checkpoints", (e) => {
        const p = e.features?.[0]?.properties;
        if (!p) return;
        new maplibregl.Popup({ closeButton: false })
          .setLngLat(e.lngLat)
          .setHTML(p.html)
          .addTo(map);
      });
      for (const layer of ["routes", "checkpoints"]) {
        map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""));
      }
      setReady(true);
    });

    mapRef.current = map;
    return () => map.remove();
  }, []);

  // move to the region when it changes and there's no trip on screen
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || plan) return;
    map.flyTo({ center: [region.center[1], region.center[0]], zoom: region.zoom, pitch: 45, duration: 1200 });
  }, [ready, region, plan]);

  // fit to all routes when a new plan comes in
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !plan) return;
    const bounds = new maplibregl.LngLatBounds();
    plan.routes.forEach((r) => r.geometry.forEach((p) => bounds.extend(p)));
    map.fitBounds(bounds, { padding: 60, pitch: 45, duration: 800 });

    const line = plan.routes[0]?.geometry ?? [];
    if (line.length < 2) return;
    const start = new maplibregl.Marker({ color: ORIGIN_COLOR }).setLngLat(line[0]).addTo(map);
    const end = new maplibregl.Marker({ color: DESTINATION_COLOR }).setLngLat(line[line.length - 1]).addTo(map);
    return () => {
      start.remove();
      end.remove();
    };
  }, [ready, plan]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    setData(map, "routes", {
      type: "FeatureCollection",
      features: (plan?.routes ?? []).map((r, i) => ({
        type: "Feature",
        properties: { id: r.id, selected: r.id === selectedId, color: routeColor(i) },
        geometry: { type: "LineString", coordinates: r.geometry },
      })),
    });

    const route = plan?.routes.find((r) => r.id === selectedId);
    setData(map, "checkpoints", {
      type: "FeatureCollection",
      features: (route?.checkpoints ?? []).map((cp) => {
        const w = cp.weather;
        const detail = w
          ? `Wind ${w.wind_mph} mph, rain ${w.rain_in} in/hr, snow ${w.snow_in} in/hr`
          : "Outside forecast range";
        return {
          type: "Feature",
          properties: {
            color: levelColor(cp.level),
            html: `<b>Mile ${Math.round(cp.mile)}</b><br>Arrive ${clock(cp.eta)}<br>${levelName(cp.level)}${cp.driver ? ` (${cp.driver})` : ""}<br>${detail}`,
          },
          geometry: { type: "Point", coordinates: [cp.lng, cp.lat] },
        };
      }),
    });
  }, [ready, plan, selectedId]);

  const frames = useMemo(() => (heatmap ? heatFrames(heatmap) : []), [heatmap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    setData(map, "heat", frames[hour] ?? EMPTY);
  }, [ready, frames, hour]);

  return (
    <div className={styles.wrap}>
      <div ref={box} className={styles.map} />
      <div className={styles.legend}>
        {LEVEL_NAMES.map((name, i) => (
          <span key={name}>
            <i style={{ background: LEVEL_COLORS[i] }} />
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}