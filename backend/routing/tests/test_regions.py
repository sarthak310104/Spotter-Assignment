from routing.regions import REGIONS
from routing.services import here


def test_regions_list(client):
    body = client.get("/api/regions/").json()
    ids = [r["id"] for r in body["regions"]]
    assert body["default"] == "us"
    assert {"us", "eu", "in"} <= set(ids)
    assert "countries" not in body["regions"][0]
    units = {r["id"]: r["units"] for r in body["regions"]}
    assert units["us"] == "imperial" and units["in"] == "metric"


def test_unknown_region_is_rejected(client):
    resp = client.get("/api/places/?q=Paris&region=mars")
    assert resp.status_code == 400


def test_search_is_limited_to_region(client, monkeypatch):
    sent = {}

    def fake_get(url, params):
        sent.update(params)
        return {"items": [{"title": "Paris", "position": {"lat": 48.85, "lng": 2.35}, "address": {"countryCode": "FRA"}}]}

    monkeypatch.setattr(here, "_get", fake_get)
    body = client.get("/api/places/?q=Paris&region=eu").json()
    assert body == [{"label": "Paris", "lat": 48.85, "lng": 2.35, "country": "FRA"}]
    assert sent["in"] == "countryCode:" + ",".join(REGIONS["eu"]["countries"])
    assert sent["at"] == "50.0,10.0"