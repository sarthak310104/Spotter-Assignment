from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

KM_PER_MI = 1.609344


class PlaceSerializer(serializers.Serializer):
    label = serializers.CharField(required=False, allow_blank=True)
    lat = serializers.FloatField(min_value=-90, max_value=90)
    lng = serializers.FloatField(min_value=-180, max_value=180)


def _check_departure(value):
    now = timezone.now()
    if value < now - timedelta(hours=1):
        raise serializers.ValidationError("Departure can't be in the past")
    if value > now + timedelta(days=7):
        raise serializers.ValidationError("Forecast only covers the next 7 days")
    return value


class PlanSerializer(serializers.Serializer):
    origin = PlaceSerializer()
    destination = PlaceSerializer()
    departure = serializers.DateTimeField(validators=[_check_departure])
    load_lb = serializers.IntegerField(min_value=1, max_value=200_000)
    interval = serializers.ChoiceField(choices=[10, 25, 50], default=25)
    interval_unit = serializers.ChoiceField(choices=["mi", "km"], default="mi")

    def validate(self, data):
        # the planner samples in miles, so 25 km becomes ~15.5 mi here
        step = data.pop("interval")
        data["interval_mi"] = step if data.pop("interval_unit") == "mi" else step / KM_PER_MI
        return data


class HeatmapSerializer(serializers.Serializer):
    corridor = serializers.ListField(
        child=serializers.ListField(child=serializers.FloatField(), min_length=2, max_length=2),
        min_length=1,
        max_length=2000,
    )
    departure = serializers.DateTimeField(validators=[_check_departure])
    load_lb = serializers.IntegerField(min_value=1, max_value=200_000)