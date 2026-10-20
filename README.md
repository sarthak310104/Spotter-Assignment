# Truck Weather Routing

React + Django app that picks the safest truck route between two US places using forecast weather at the truck's ETA, the load weight and travel time.

## Run locally

Backend (needs a free HERE API key from platform.here.com):

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add HERE_API_KEY
python manage.py migrate
python manage.py createcachetable
python manage.py runserver
```

Frontend:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Tests: `cd backend && pytest`

`test_planner.py` runs the whole planner with faked routes and weather: calm weather, heavy rain on one route, and the 30,000 / 40,000 lb wind rules.

## Seeing bad weather in the UI

Real weather is often calm, so there's a demo switch. Set `DEMO_STORM` in `backend/.env` to a lat,lng and restart the server:

```
DEMO_STORM=35.22,-101.83
```

That adds a storm (up to ~53 mph wind, ~0.8 in/hr rain, about 90 mi wide) on top of the real forecast. It is strongest from about 2h to 30h after now and drifts east, so the slider shows it build and fade. Leave it empty for real weather.

## How it works

1. HERE Routing v8 (truck mode, gross weight set) returns up to 3 routes.
2. Each route is sampled every 10/25/50 miles. ETA at a checkpoint = departure + route duration x share of distance covered.
3. Open-Meteo hourly forecast (wind mph, rain + showers in/hr, snowfall in/hr) is read at the hour nearest each ETA.
4. Each checkpoint takes the worst of wind, rain and snow levels, with the load rules applied to wind.
5. A stretch between two checkpoints counts at the worse level of its two ends.
6. Routes are ranked by: no-travel miles, severe miles, high miles, average risk, travel time.

The heatmap is a grid of cells within 40 miles of any route, with levels for every hour from departure to +48h. The slider swaps pre-built hourly layers, so scrubbing doesn't hit the API.

## Regions

Pick a region first (United States, Canada, North America, Europe, United Kingdom, India, Australia). Place search is limited to that region's countries and the map moves there. Regions live in `backend/routing/regions.py`, so adding one is a single entry.

## Assumptions

- The brief's rules are in US units (mph, in/hr, lb), so the backend always works in those.
- Display units follow the trip: km, kg, km/h, mm/hr and cm/hr only when both origin and destination use metric. Anything touching the US or UK (whose roads use miles), including a USA to Canada run, stays in miles and lb. Checkpoint spacing keeps the same numbers in both systems: every 10/25/50 miles, or every 10/25/50 km on metric trips (the backend converts km to miles before sampling).

- Range boundaries: lower bound inclusive (25 mph is Moderate, 0.25 in/hr rain is High), 1.00 in/hr rain and 3.0 in/hr snow are still Severe.
- No-travel miles rank worse than severe miles, even though the brief only lists severe and high.
- Speed is treated as constant along a route when computing ETAs.
- Weather responses are cached per grid cell for 30 minutes.