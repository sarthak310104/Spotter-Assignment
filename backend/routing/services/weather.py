from concurrent.futures import ThreadPoolExecutor

import requests
from django.conf import settings
from django.core.cache import cache

from . import storm

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
BATCH_SIZE = 50
FORECAST_DAYS = 10


def _key(cell):
    return f"wx:{cell[0]}:{cell[1]}"


def _fetch_batch(cells):
    resp = requests.get(
        OPEN_METEO_URL,
        params={
            "latitude": ",".join(str(c[0]) for c in cells),
            "longitude": ",".join(str(c[1]) for c in cells),
            "hourly": "wind_speed_10m,rain,showers,snowfall",
            "wind_speed_unit": "mph",
            "precipitation_unit": "inch",
            "timeformat": "unixtime",
            "timezone": "GMT",
            "forecast_days": FORECAST_DAYS,
        },
        timeout=20,
    )
    resp.raise_for_status()
    body = resp.json()
    body = body if isinstance(body, list) else [body]

    out = {}
    for cell, loc in zip(cells, body):
        h = loc["hourly"]
        out[cell] = {
            "start": h["time"][0],
            "wind": [v or 0 for v in h["wind_speed_10m"]],
            "rain": [(r or 0) + (s or 0) for r, s in zip(h["rain"], h["showers"])],
            "snow": [v or 0 for v in h["snowfall"]],
        }
    return out


def get_series(cells):
    # hourly series per (lat, lng) cell, cached so the slider and re-plans are cheap
    cells = list(dict.fromkeys(cells))
    cached = cache.get_many([_key(c) for c in cells])
    found = {c: cached[_key(c)] for c in cells if _key(c) in cached}
    missing = [c for c in cells if c not in found]

    batches = [missing[i : i + BATCH_SIZE] for i in range(0, len(missing), BATCH_SIZE)]
    with ThreadPoolExecutor(max_workers=4) as pool:
        for result in pool.map(_fetch_batch, batches):
            found.update(result)
            cache.set_many(
                {_key(c): s for c, s in result.items()},
                timeout=settings.WEATHER_CACHE_SECONDS,
            )
    if settings.DEMO_STORM:
        return {c: storm.apply(c, s, settings.DEMO_STORM) for c, s in found.items()}
    return found


def at(series, ts):
    # nearest forecast hour to a unix timestamp, None if outside the forecast
    if not series:
        return None
    idx = round((ts - series["start"]) / 3600)
    if idx < 0 or idx >= len(series["wind"]):
        return None
    return {
        "wind_mph": round(series["wind"][idx], 1),
        "rain_in": round(series["rain"][idx], 3),
        "snow_in": round(series["snow"][idx], 3),
    }