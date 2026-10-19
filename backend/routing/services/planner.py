from . import here, weather
from .geo import sample_every, snap, thin
from .recommend import pick_best, summarize
from .risk import assess

CHECKPOINT_CELL = 0.1  # degrees (~7 mi), checkpoints closer than this share a forecast
METERS_PER_MILE = 1609.344


def _checkpoints(route, departure_ts, interval_mi):
    total_mi = route["length_m"] / METERS_PER_MILE
    raw = sample_every(route["points"], interval_mi)
    # the polyline length and HERE's length differ a little, so scale miles to HERE's
    scale = total_mi / raw[-1][2] if raw and raw[-1][2] else 1.0
    out = []
    for lat, lng, mile in raw:
        mile *= scale
        eta = departure_ts + route["duration_s"] * (mile / total_mi if total_mi else 0)
        out.append({"lat": lat, "lng": lng, "mile": round(mile, 1), "eta": int(eta)})
    return out


def plan_trip(origin, destination, departure, load_lb, interval_mi):
    routes = here.truck_routes(origin, destination, departure, load_lb)
    departure_ts = departure.timestamp()

    for r in routes:
        r["checkpoints"] = _checkpoints(r, departure_ts, interval_mi)

    cell = lambda cp: (snap(cp["lat"], CHECKPOINT_CELL), snap(cp["lng"], CHECKPOINT_CELL))
    series = weather.get_series([cell(cp) for r in routes for cp in r["checkpoints"]])

    for r in routes:
        for cp in r["checkpoints"]:
            wx = weather.at(series.get(cell(cp)), cp["eta"])
            cp["weather"] = wx
            if wx:
                cp["level"], cp["driver"] = assess(
                    wx["wind_mph"], wx["rain_in"], wx["snow_in"], load_lb
                )
            else:
                cp["level"], cp["driver"] = None, None

        r["summary"] = {
            **summarize(r["checkpoints"]),
            "distance_mi": round(r["length_m"] / METERS_PER_MILE, 1),
            "duration_s": r["duration_s"],
            "roads": r["roads"],
        }

    best = pick_best(routes)
    corridor = [p for r in routes for p in thin(r["points"], 15)]

    return {
        "recommended": best,
        "routes": [
            {
                "id": r["id"],
                # [lng, lat] so the frontend can drop it straight into GeoJSON
                "geometry": [[p[1], p[0]] for p in thin(r["points"], 0.3)],
                "checkpoints": r["checkpoints"],
                "summary": r["summary"],
            }
            for r in routes
        ],
        "corridor": [[round(p[0], 4), round(p[1], 4)] for p in corridor],
    }
