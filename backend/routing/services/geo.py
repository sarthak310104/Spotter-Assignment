import math

EARTH_RADIUS_MI = 3958.8


def haversine_mi(a, b):
    lat1, lng1 = map(math.radians, a)
    lat2, lng2 = map(math.radians, b)
    h = (
        math.sin((lat2 - lat1) / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin((lng2 - lng1) / 2) ** 2
    )
    return 2 * EARTH_RADIUS_MI * math.asin(math.sqrt(h))


def cumulative_miles(points):
    out = [0.0]
    for prev, cur in zip(points, points[1:]):
        out.append(out[-1] + haversine_mi(prev, cur))
    return out


def sample_every(points, step_mi):
    # (lat, lng, mile) every step_mi along the line, both ends included
    if len(points) < 2:
        return [(points[0][0], points[0][1], 0.0)] if points else []

    dist = cumulative_miles(points)
    total = dist[-1]
    marks = [n * step_mi for n in range(int(total // step_mi) + 1)]
    if total - marks[-1] > 0.01:
        marks.append(total)

    out, i = [], 1
    for mark in marks:
        while i < len(dist) - 1 and dist[i] < mark:
            i += 1
        seg = dist[i] - dist[i - 1]
        f = 0.0 if seg == 0 else min(1.0, (mark - dist[i - 1]) / seg)
        (lat1, lng1), (lat2, lng2) = points[i - 1], points[i]
        out.append((lat1 + f * (lat2 - lat1), lng1 + f * (lng2 - lng1), mark))
    return out


def thin(points, min_mi):
    # drops points closer than min_mi to the last kept one, keeps the end
    if len(points) < 3:
        return list(points)
    kept = [points[0]]
    for p in points[1:-1]:
        if haversine_mi(kept[-1], p) >= min_mi:
            kept.append(p)
    kept.append(points[-1])
    return kept


def snap(value, size):
    return round(round(value / size) * size, 4)
