# place search is limited to the chosen region; center is [lat, lng] for the map
# units is only the default before both places are picked
EUROPE = [
    "ALB", "AND", "AUT", "BEL", "BGR", "BIH", "CHE", "CZE", "DEU", "DNK", "ESP", "EST",
    "FIN", "FRA", "GBR", "GRC", "HRV", "HUN", "IRL", "ITA", "LIE", "LTU", "LUX", "LVA",
    "MKD", "MNE", "NLD", "NOR", "POL", "PRT", "ROU", "SRB", "SVK", "SVN", "SWE",
]

REGIONS = {
    "us": {"name": "United States", "countries": ["USA"], "center": [39.8, -98.6], "zoom": 3.6, "units": "imperial"},
    "ca": {"name": "Canada", "countries": ["CAN"], "center": [55.0, -97.0], "zoom": 2.8, "units": "metric"},
    "na": {"name": "North America", "countries": ["USA", "CAN", "MEX"], "center": [42.0, -100.0], "zoom": 2.4, "units": "imperial"},
    "eu": {"name": "Europe", "countries": EUROPE, "center": [50.0, 10.0], "zoom": 3.4, "units": "metric"},
    "gb": {"name": "United Kingdom", "countries": ["GBR"], "center": [54.5, -3.0], "zoom": 4.8, "units": "imperial"},
    "in": {"name": "India", "countries": ["IND"], "center": [22.5, 79.0], "zoom": 3.8, "units": "metric"},
    "au": {"name": "Australia", "countries": ["AUS"], "center": [-26.0, 134.0], "zoom": 3.2, "units": "metric"},
}

DEFAULT_REGION = "us"


def public_list():
    return [
        {"id": rid, "name": r["name"], "center": r["center"], "zoom": r["zoom"], "units": r["units"]}
        for rid, r in REGIONS.items()
    ]