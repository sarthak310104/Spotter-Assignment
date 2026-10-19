import math

from .geo import haversine_mi

RADIUS_MI = 90
DRIFT_MPH = 6  # storm moves east
PEAK_WIND = 48
PEAK_RAIN = 0.8


def apply(cell, series, center):
    # adds a fake storm on top of the real forecast, for demos only
    lat0, lng0 = center
    out = {**series, "wind": list(series["wind"]), "rain": list(series["rain"])}
    for h in range(len(out["wind"])):
        # near full strength from about 2h to 30h, gone by 40h
        strength = math.exp(-(((h - 16) / 16) ** 4))
        # passes over the center at the peak hour
        moved = DRIFT_MPH * (h - 16) / 69 / math.cos(math.radians(lat0))
        dist = haversine_mi(cell, (lat0, lng0 + moved))
        f = strength * math.exp(-((dist / RADIUS_MI) ** 2))
        out["wind"][h] += PEAK_WIND * f
        out["rain"][h] += PEAK_RAIN * f
    return out