from . import weather
from .geo import haversine_mi, snap
from .risk import assess

HOURS = 49  # 0 to 48 inclusive
CORRIDOR_MI = 40


def _grid(corridor, size):
    lats = [p[0] for p in corridor]
    lngs = [p[1] for p in corridor]
    pad = size * 2
    lat, cells = snap(min(lats) - pad, size), []
    while lat <= max(lats) + pad:
        lng = snap(min(lngs) - pad, size)
        while lng <= max(lngs) + pad:
            if any(haversine_mi((lat, lng), p) <= CORRIDOR_MI for p in corridor):
                cells.append((lat, lng))
            lng = snap(lng + size, size)
        lat = snap(lat + size, size)
    return cells


def _score(wx):
    # 0..1 intensity used for column height, separate from the risk level
    return round(min(1.0, max(wx["wind_mph"] / 55, wx["rain_in"] / 1.0, wx["snow_in"] / 3.0)), 2)


def build(corridor, departure, load_lb):
    span = max(
        max(p[0] for p in corridor) - min(p[0] for p in corridor),
        max(p[1] for p in corridor) - min(p[1] for p in corridor),
    )
    size = 0.25 if span < 6 else 0.5
    cells = _grid(corridor, size)
    series = weather.get_series(cells)
    start = int(departure.timestamp()) // 3600 * 3600

    levels, scores = [], []
    for h in range(HOURS):
        ts = start + h * 3600
        row_l, row_s = [], []
        for c in cells:
            wx = weather.at(series.get(c), ts)
            if wx is None:
                row_l.append(-1)
                row_s.append(0)
            else:
                row_l.append(assess(wx["wind_mph"], wx["rain_in"], wx["snow_in"], load_lb)[0])
                row_s.append(_score(wx))
        levels.append(row_l)
        scores.append(row_s)

    return {
        "size": size,
        "start": start,
        "cells": [[c[0], c[1]] for c in cells],
        "levels": levels,
        "scores": scores,
    }
