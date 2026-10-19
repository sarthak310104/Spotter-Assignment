from routing.services.geo import haversine_mi, sample_every, thin

DALLAS = (32.7767, -96.7970)
DENVER = (39.7392, -104.9903)


def test_haversine_dallas_denver():
    assert 655 < haversine_mi(DALLAS, DENVER) < 670


def test_sample_spacing_and_ends():
    line = [(30.0, -100.0), (31.0, -100.0)]  # ~69 mi straight north
    pts = sample_every(line, 25)
    miles = [round(p[2]) for p in pts]
    assert miles[:3] == [0, 25, 50]
    assert pts[0][:2] == line[0]
    assert abs(pts[-1][0] - 31.0) < 1e-9


def test_thin_keeps_ends():
    line = [(30 + i * 0.001, -100.0) for i in range(100)]
    out = thin(line, 1)
    assert out[0] == line[0] and out[-1] == line[-1]
    assert len(out) < len(line)
