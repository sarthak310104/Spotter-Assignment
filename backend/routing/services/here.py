from collections import defaultdict

import flexpolyline
import requests
from django.conf import settings

ROUTES_URL = "https://router.hereapi.com/v8/routes"
AUTOSUGGEST_URL = "https://autosuggest.search.hereapi.com/v1/autosuggest"
LB_TO_KG = 0.45359237


class HereError(Exception):
    pass


def _get(url, params):
    if not settings.HERE_API_KEY:
        raise HereError("HERE_API_KEY is not set")
    resp = requests.get(url, params={**params, "apiKey": settings.HERE_API_KEY}, timeout=20)
    if resp.status_code != 200:
        raise HereError(f"HERE returned {resp.status_code}: {resp.text[:200]}")
    return resp.json()


def suggest(query, region):
    lat, lng = region["center"]
    data = _get(
        AUTOSUGGEST_URL,
        {
            "q": query,
            "at": f"{lat},{lng}",
            "in": "countryCode:" + ",".join(region["countries"]),
            "limit": 6,
        },
    )
    out = []
    for item in data.get("items", []):
        pos = item.get("position")
        if pos:
            address = item.get("address", {})
            out.append(
                {
                    "label": address.get("label") or item.get("title"),
                    "lat": pos["lat"],
                    "lng": pos["lng"],
                    "country": address.get("countryCode"),  # ISO 3166 alpha-3, e.g. "USA"
                }
            )
    return out


def _main_roads(sections, top=2):
    # longest numbered roads on the route, e.g. ["I-35", "I-70"]
    length = defaultdict(float)
    for sec in sections:
        for span in sec.get("spans", []):
            for num in span.get("routeNumbers", []):
                length[num["value"]] += span.get("length", 0)
    return [name for name, _ in sorted(length.items(), key=lambda kv: -kv[1])[:top]]


def truck_routes(origin, destination, departure, load_lb):
    data = _get(
        ROUTES_URL,
        {
            "transportMode": "truck",
            "origin": f"{origin['lat']},{origin['lng']}",
            "destination": f"{destination['lat']},{destination['lng']}",
            "departureTime": departure.isoformat(),
            "alternatives": 2,
            "return": "polyline,summary",
            "spans": "routeNumbers,length",
            "vehicle[grossWeight]": int(load_lb * LB_TO_KG),
        },
    )

    routes = []
    for n, route in enumerate(data.get("routes", []), start=1):
        sections = route["sections"]
        points = []
        for sec in sections:
            pts = [(p[0], p[1]) for p in flexpolyline.decode(sec["polyline"])]
            points.extend(pts if not points else pts[1:])
        routes.append(
            {
                "id": f"r{n}",
                "points": points,
                "duration_s": sum(s["summary"]["duration"] for s in sections),
                "length_m": sum(s["summary"]["length"] for s in sections),
                "roads": _main_roads(sections),
            }
        )
    if not routes:
        raise HereError("No truck route found between these places")
    return routes