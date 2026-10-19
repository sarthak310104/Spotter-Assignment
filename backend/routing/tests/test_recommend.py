from routing.services.recommend import pick_best, summarize


def cps(*levels, step=25):
    return [{"mile": i * step, "level": lvl} for i, lvl in enumerate(levels)]


def route(rid, levels, duration):
    return {"id": rid, "summary": {**summarize(cps(*levels)), "duration_s": duration}}


def test_segment_takes_worse_end():
    s = summarize(cps(0, 2, 0))
    assert s["miles_by_level"] == [0.0, 0.0, 50.0, 0.0, 0.0]


def test_unknown_miles_are_kept_out_of_average():
    s = summarize(cps(0, 0, None))
    assert s["unknown_mi"] == 25.0
    assert s["avg_risk"] == 0.0


def test_fewest_severe_beats_faster():
    slow_safe = route("a", [0, 2, 2, 0], 9000)
    fast_severe = route("b", [0, 3, 0], 5000)
    assert pick_best([fast_severe, slow_safe]) == "a"


def test_high_miles_then_average_then_time():
    more_high = route("a", [0, 2, 2, 0], 5000)
    less_high = route("b", [0, 2, 0, 0], 9000)
    assert pick_best([more_high, less_high]) == "b"

    calm = route("c", [0, 0, 0], 9000)
    breezy = route("d", [0, 1, 0], 5000)
    assert pick_best([breezy, calm]) == "c"

    same_a = route("e", [0, 0], 9000)
    same_b = route("f", [0, 0], 8000)
    assert pick_best([same_a, same_b]) == "f"


def test_no_travel_is_worst():
    blocked = route("a", [0, 4, 0], 1000)
    severe = route("b", [0, 3, 3, 0], 9000)
    assert pick_best([blocked, severe]) == "b"
