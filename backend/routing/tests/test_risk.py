import pytest

from routing.services.risk import (
    HIGH,
    LOW,
    MODERATE,
    NO_TRAVEL,
    SEVERE,
    assess,
    rain_level,
    snow_level,
    wind_level,
    wind_with_load,
)


@pytest.mark.parametrize(
    "mph,level",
    [(0, LOW), (24.9, LOW), (25, MODERATE), (34.9, MODERATE), (35, HIGH), (44, HIGH),
     (45, SEVERE), (54.9, SEVERE), (55, NO_TRAVEL), (80, NO_TRAVEL)],
)
def test_wind(mph, level):
    assert wind_level(mph) == level


@pytest.mark.parametrize(
    "rain,level",
    [(0.09, LOW), (0.10, MODERATE), (0.25, HIGH), (0.50, SEVERE), (1.00, SEVERE), (1.01, NO_TRAVEL)],
)
def test_rain(rain, level):
    assert rain_level(rain) == level


@pytest.mark.parametrize(
    "snow,level",
    [(0.4, LOW), (0.5, MODERATE), (1.0, HIGH), (2.0, SEVERE), (3.0, SEVERE), (3.1, NO_TRAVEL)],
)
def test_snow(snow, level):
    assert snow_level(snow) == level


def test_load_rules():
    assert wind_with_load(60, 1_000) == NO_TRAVEL
    assert wind_with_load(50, 30_000) == SEVERE
    assert wind_with_load(50, 30_001) == NO_TRAVEL
    assert wind_with_load(40, 40_000) == HIGH
    assert wind_with_load(40, 40_001) == SEVERE
    assert wind_with_load(30, 80_000) == MODERATE


def test_assess_takes_the_worst():
    assert assess(10, 0.3, 0, 10_000) == (HIGH, "rain")
    assert assess(40, 0.3, 1.2, 45_000) == (SEVERE, "wind")
    assert assess(5, 0, 0, 10_000) == (LOW, None)
