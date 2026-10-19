from routing.services.storm import apply


def series(n=48):
    return {"start": 0, "wind": [5.0] * n, "rain": [0.0] * n, "snow": [0.0] * n}


def test_storm_is_strong_near_center_and_fades_away():
    center = (36.5, -99.5)
    near = apply((36.5, -99.5), series(), center)
    far = apply((30.0, -90.0), series(), center)
    assert max(near["wind"]) > 45
    assert max(near["rain"]) > 0.5
    assert max(far["wind"]) < 6


def test_storm_does_not_touch_the_original():
    s = series()
    apply((36.5, -99.5), s, (36.5, -99.5))
    assert s["wind"] == [5.0] * 48