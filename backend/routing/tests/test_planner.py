from datetime import datetime, timedelta, timezone

import pytest
from django.core.cache import cache

from routing.services import here, planner, weather
from routing.services.risk import HIGH, NO_TRAVEL, SEVERE

DALLAS = {"lat": 32.78, "lng": -96.80}
DENVER = {"lat": 39.74, "lng": -104.99}
HOUR = 3600


def line(*stops, steps=40):
    pts = []
    for (lat1, lng1), (lat2, lng2) in zip(stops, stops[1:]):
        pts += [(lat1 + (lat2 - lat1) * t / steps, lng1 + (lng2 - lng1) * t / steps) for t in range(steps)]
    return pts + [stops[-1]]


# a fast route through Kansas and a slower one through the Texas panhandle
FAST = {"id": "r1", "points": line((32.78, -96.8), (37.7, -97.3), (39.74, -104.99)),
        "duration_s": 12 * HOUR, "length_m": 1_190_000, "roads": ["I-35", "I-70"]}
SLOW = {"id": "r2", "points": line((32.78, -96.8), (35.2, -101.8), (39.74, -104.99)),
        "duration_s": 14 * HOUR, "length_m": 1_260_000, "roads": ["US-287", "I-25"]}


@pytest.fixture
def trip(monkeypatch, settings):
    settings.CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
    settings.DEMO_STORM = None
    monkeypatch.setattr(here, "truck_routes", lambda *a: [dict(FAST), dict(SLOW)])
    departure = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)

    def run(storm_wind=0, storm_rain=0, load_lb=20_000):
        # storm sits over Kansas (lat > 36, lng > -100), calm everywhere else
        def fake_batch(cells):
            start = int(departure.timestamp()) - HOUR
            out = {}
            for c in cells:
                hit = c[0] > 36 and c[1] > -100
                out[c] = {"start": start,
                          "wind": [storm_wind if hit else 8] * 240,
                          "rain": [storm_rain if hit else 0] * 240,
                          "snow": [0] * 240}
            return out

        monkeypatch.setattr(weather, "_fetch_batch", fake_batch)
        cache.clear()
        return planner.plan_trip(DALLAS, DENVER, departure, load_lb, 25)

    return run


def by_id(plan, rid):
    return next(r for r in plan["routes"] if r["id"] == rid)


def test_calm_weather_picks_faster_route(trip):
    plan = trip()
    assert plan["recommended"] == "r1"
    assert all(cp["level"] == 0 for r in plan["routes"] for cp in r["checkpoints"])


def test_heavy_rain_on_fast_route_picks_the_other(trip):
    plan = trip(storm_rain=0.7)
    fast = by_id(plan, "r1")
    assert fast["summary"]["miles_by_level"][SEVERE] > 0
    assert any(cp["driver"] == "rain" for cp in fast["checkpoints"])
    assert plan["recommended"] == "r2"


def test_heavy_load_turns_wind_into_no_travel(trip):
    light = by_id(trip(storm_wind=48, load_lb=20_000), "r1")
    heavy = by_id(trip(storm_wind=48, load_lb=35_000), "r1")
    assert light["summary"]["miles_by_level"][SEVERE] > 0
    assert light["summary"]["miles_by_level"][NO_TRAVEL] == 0
    assert heavy["summary"]["miles_by_level"][NO_TRAVEL] > 0


def test_wind_40mph_is_severe_only_over_40k_lb(trip):
    light = by_id(trip(storm_wind=40, load_lb=40_000), "r1")
    heavy = by_id(trip(storm_wind=40, load_lb=40_001), "r1")
    assert light["summary"]["miles_by_level"][HIGH] > 0
    assert light["summary"]["miles_by_level"][SEVERE] == 0
    assert heavy["summary"]["miles_by_level"][SEVERE] > 0


def test_checkpoint_etas_follow_distance(trip):
    cps = by_id(trip(), "r1")["checkpoints"]
    assert cps[0]["mile"] == 0
    assert all(b["eta"] > a["eta"] for a, b in zip(cps, cps[1:]))
    assert all(b["mile"] - a["mile"] <= 25.1 for a, b in zip(cps, cps[1:]))