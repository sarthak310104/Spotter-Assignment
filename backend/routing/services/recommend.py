from .risk import HIGH, NO_TRAVEL, SEVERE


def summarize(checkpoints):
    # each stretch between two checkpoints takes the worse of its two ends
    miles = [0.0] * 5
    unknown = 0.0
    for a, b in zip(checkpoints, checkpoints[1:]):
        seg = b["mile"] - a["mile"]
        if a["level"] is None or b["level"] is None:
            unknown += seg
        else:
            miles[max(a["level"], b["level"])] += seg

    known = sum(miles)
    avg = sum(level * m for level, m in enumerate(miles)) / known if known else 0.0
    return {
        "miles_by_level": [round(m, 1) for m in miles],
        "unknown_mi": round(unknown, 1),
        "avg_risk": round(avg, 3),
    }


def rank_key(route):
    s = route["summary"]
    by_level = s["miles_by_level"]
    # no-travel miles aren't in the brief's list but obviously rank worse than severe
    return (
        by_level[NO_TRAVEL],
        by_level[SEVERE],
        by_level[HIGH],
        s["avg_risk"],
        s["duration_s"],
    )


def pick_best(routes):
    return min(routes, key=rank_key)["id"] if routes else None
