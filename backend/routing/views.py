import requests
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .regions import DEFAULT_REGION, REGIONS, public_list
from .serializers import HeatmapSerializer, PlanSerializer
from .services import heatmap, here, planner


def _upstream_error(exc):
    return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)


class HealthView(APIView):
    def get(self, request):
        return Response({"ok": True})


class RegionsView(APIView):
    def get(self, request):
        return Response({"default": DEFAULT_REGION, "regions": public_list()})


class PlacesView(APIView):
    def get(self, request):
        q = request.query_params.get("q", "").strip()
        region = REGIONS.get(request.query_params.get("region", DEFAULT_REGION))
        if region is None:
            return Response({"detail": "Unknown region"}, status=status.HTTP_400_BAD_REQUEST)
        if len(q) < 3:
            return Response([])
        try:
            return Response(here.suggest(q, region))
        except (here.HereError, requests.RequestException) as exc:
            return _upstream_error(exc)


class PlanView(APIView):
    def post(self, request):
        s = PlanSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        try:
            return Response(planner.plan_trip(**s.validated_data))
        except (here.HereError, requests.RequestException) as exc:
            return _upstream_error(exc)


class HeatmapView(APIView):
    def post(self, request):
        s = HeatmapSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        try:
            return Response(heatmap.build(**s.validated_data))
        except requests.RequestException as exc:
            return _upstream_error(exc)