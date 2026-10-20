from datetime import datetime, timedelta, timezone

from django.core.cache import cache

from routing.services import heatmap, weather

HOUR = 3600


def test_heatmap_cells_carry_weather_and_driver(monkeypatch, settings):
    settings.CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
    settings.DEMO_STORM = None
    departure = datetime.now(timezone.utc) + timedelta(hours=1)

    def fake_batch(cells):
        start = int(departure.timestamp()) // HOUR * HOUR
        return {c: {"start": start, "wind": [30] * 240, "rain": [0.0] * 240, "snow": [0.0] * 240} for c in cells}

    monkeypatch.setattr(weather, "_fetch_batch", fake_batch)
    cache.clear()
    hm = heatmap.build([[36.0, -99.0], [36.5, -98.5]], departure, 20_000)

    assert len(hm["weather"]) == heatmap.HOURS
    assert len(hm["weather"][0]) == len(hm["cells"])
    assert hm["weather"][0][0] == [30, 0.0, 0.0]
    assert hm["levels"][0][0] == 1
    assert hm["drivers"][0][0] == "wind"