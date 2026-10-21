import pytest

from routing.services import weather


class FakeResp:
    def __init__(self, status, body=None):
        self.status_code = status
        self.headers = {}
        self._body = body

    def raise_for_status(self):
        pass

    def json(self):
        return self._body


HOURLY = {"time": [0], "wind_speed_10m": [12], "rain": [0.1], "showers": [0.05], "snowfall": [None]}


@pytest.fixture(autouse=True)
def no_sleep(monkeypatch):
    monkeypatch.setattr(weather.time, "sleep", lambda s: None)


def test_retries_after_429_then_succeeds(monkeypatch):
    replies = [FakeResp(429), FakeResp(200, {"hourly": HOURLY})]
    monkeypatch.setattr(weather, "_request", lambda cells: replies.pop(0))
    out = weather._fetch_batch([(36.0, -99.0)])
    assert out[(36.0, -99.0)]["wind"] == [12]
    assert out[(36.0, -99.0)]["rain"] == [pytest.approx(0.15)]
    assert out[(36.0, -99.0)]["snow"] == [0]


def test_gives_up_after_repeated_429(monkeypatch):
    monkeypatch.setattr(weather, "_request", lambda cells: FakeResp(429))
    with pytest.raises(weather.WeatherBusy):
        weather._fetch_batch([(36.0, -99.0)])


def test_busy_weather_returns_503(client, monkeypatch, settings):
    settings.CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
    monkeypatch.setattr(weather, "_request", lambda cells: FakeResp(429))
    from datetime import timedelta
    from django.utils import timezone
    resp = client.post(
        "/api/heatmap/",
        {"corridor": [[36.0, -99.0]], "departure": (timezone.now() + timedelta(hours=1)).isoformat(), "load_lb": 20000},
        content_type="application/json",
    )
    assert resp.status_code == 503
    assert "busy" in resp.json()["detail"]

def test_429_reason_is_kept(monkeypatch):
    monkeypatch.setattr(weather, "_request", lambda cells: FakeResp(429, {"error": True, "reason": "Daily API request limit exceeded"}))
    with pytest.raises(weather.WeatherBusy, match="Daily"):
        weather._fetch_batch([(36.0, -99.0)])


def test_requests_go_to_configured_url_with_key(monkeypatch, settings):
    settings.WEATHER_URL = "https://wx-proxy.example.workers.dev/v1/forecast"
    settings.WEATHER_PROXY_KEY = "secret"
    seen = {}

    def fake_get(url, params, headers, timeout):
        seen.update(url=url, headers=headers)
        return FakeResp(200, {"hourly": HOURLY})

    monkeypatch.setattr(weather.requests, "get", fake_get)
    weather._fetch_batch([(36.0, -99.0)])
    assert seen == {"url": "https://wx-proxy.example.workers.dev/v1/forecast", "headers": {"X-Proxy-Key": "secret"}}


def test_default_url_is_open_meteo_without_key(settings):
    assert settings.WEATHER_URL == "https://api.open-meteo.com/v1/forecast"