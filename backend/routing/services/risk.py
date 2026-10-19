LOW, MODERATE, HIGH, SEVERE, NO_TRAVEL = range(5)
LEVEL_NAMES = ["low", "moderate", "high", "severe", "no_travel"]


def wind_level(mph):
    if mph < 25:
        return LOW
    if mph < 35:
        return MODERATE
    if mph < 45:
        return HIGH
    if mph < 55:
        return SEVERE
    return NO_TRAVEL


def rain_level(in_hr):
    if in_hr < 0.10:
        return LOW
    if in_hr < 0.25:
        return MODERATE
    if in_hr < 0.50:
        return HIGH
    if in_hr <= 1.00:
        return SEVERE
    return NO_TRAVEL


def snow_level(in_hr):
    if in_hr < 0.5:
        return LOW
    if in_hr < 1.0:
        return MODERATE
    if in_hr < 2.0:
        return HIGH
    if in_hr <= 3.0:
        return SEVERE
    return NO_TRAVEL


def wind_with_load(mph, load_lb):
    level = wind_level(mph)
    if level == SEVERE and load_lb > 30_000:
        return NO_TRAVEL
    if level == HIGH and load_lb > 40_000:
        return SEVERE
    return level


def assess(wind_mph, rain_in, snow_in, load_lb):
    # worst of the three wins; driver is the condition that set it
    levels = {
        "wind": wind_with_load(wind_mph, load_lb),
        "rain": rain_level(rain_in),
        "snow": snow_level(snow_in),
    }
    driver = max(levels, key=levels.get)
    level = levels[driver]
    return level, (driver if level > LOW else None)
