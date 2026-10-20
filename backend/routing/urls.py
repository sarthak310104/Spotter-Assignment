from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.HealthView.as_view()),
    path("regions/", views.RegionsView.as_view()),
    path("places/", views.PlacesView.as_view()),
    path("plan/", views.PlanView.as_view()),
    path("heatmap/", views.HeatmapView.as_view()),
]