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
    # hour 0 is the departure itself; at() picks the nearest forecast hour
    start = int(departure.timestamp())

    # one row per hour, one entry per cell; weather is [wind_mph, rain_in, snow_in]
    levels, scores, conditions, drivers = [], [], [], []
    for h in range(HOURS):
        ts = start + h * 3600
        row_l, row_s, row_w, row_d = [], [], [], []
        for c in cells:
            wx = weather.at(series.get(c), ts)
            if wx is None:
                row_l.append(-1)
                row_s.append(0)
                row_w.append(None)
                row_d.append(None)
            else:
                level, driver = assess(wx["wind_mph"], wx["rain_in"], wx["snow_in"], load_lb)
                row_l.append(level)
                row_s.append(_score(wx))
                row_w.append([wx["wind_mph"], wx["rain_in"], wx["snow_in"]])
                row_d.append(driver)
        levels.append(row_l)
        scores.append(row_s)
        conditions.append(row_w)
        drivers.append(row_d)

    return {
        "size": size,
        "start": start,
        "cells": [[c[0], c[1]] for c in cells],
        "levels": levels,
        "scores": scores,
        "weather": conditions,
        "drivers": drivers,
    }