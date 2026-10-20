from datetime import timedelta

import pytest
from django.utils import timezone

from routing.serializers import PlanSerializer


def payload(**extra):
    return {
        "origin": {"lat": 8.08, "lng": 77.55},
        "destination": {"lat": 12.97, "lng": 77.59},
        "departure": (timezone.now() + timedelta(hours=1)).isoformat(),
        "load_lb": 20_000,
        **extra,
    }


@pytest.mark.parametrize(
    "extra,expected_mi",
    [({}, 25), ({"interval": 10, "interval_unit": "mi"}, 10), ({"interval": 10, "interval_unit": "km"}, 6.2137)],
)
def test_interval_is_converted_to_miles(extra, expected_mi):
    s = PlanSerializer(data=payload(**extra))
    assert s.is_valid(), s.errors
    assert s.validated_data["interval_mi"] == pytest.approx(expected_mi, abs=1e-3)
    assert "interval" not in s.validated_data and "interval_unit" not in s.validated_data


def test_bad_interval_and_fractional_load_are_rejected():
    assert not PlanSerializer(data=payload(interval=15)).is_valid()
    assert not PlanSerializer(data=payload(interval_unit="ft")).is_valid()
    assert not PlanSerializer(data=payload(load_lb=39683.2)).is_valid()