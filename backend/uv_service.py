from datetime import datetime, timezone, timedelta
import httpx


async def fetch_uv_data(lat: float, lon: float, api_key: str) -> dict:
    """Fetch current UV, sunset time, today's peak UV and window from One Call API."""
    url = "https://api.openweathermap.org/data/3.0/onecall"
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params={
            "lat": lat, "lon": lon, "appid": api_key,
            "exclude": "minutely,alerts",
        })
        response.raise_for_status()
        data = response.json()

    uv_index = data["current"]["uvi"]

    sunset_ts = data["current"].get("sunset")
    sunset = datetime.fromtimestamp(sunset_ts, tz=timezone.utc) if sunset_ts else None

    # Use timezone_offset (seconds) from the response to work in local time
    tz_offset = data.get("timezone_offset", 0)
    local_tz = timezone(timedelta(seconds=tz_offset))
    local_today = datetime.now(local_tz).date()

    def local_dt(entry):
        return datetime.fromtimestamp(entry["dt"], tz=local_tz)

    # peak_uv from daily[0] — covers the full day, past and future
    daily = data.get("daily", [])
    peak_uv = daily[0].get("uvi", uv_index) if daily else uv_index

    # peak window from hourly — hours in local today where UV ≥ 3
    hourly = data.get("hourly", [])
    todays_hourly = [h for h in hourly if local_dt(h).date() == local_today]
    high_uv_hours = [local_dt(h).hour for h in todays_hourly if h.get("uvi", 0) >= 3]

    peak_window = None
    if high_uv_hours:
        def fmt(h: int) -> str:
            if h == 0: return "12 am"
            if h < 12: return f"{h} am"
            if h == 12: return "12 pm"
            return f"{h - 12} pm"
        peak_window = f"{fmt(min(high_uv_hours))} – {fmt(max(high_uv_hours) + 1)}"

    return {
        "uv_index": uv_index,
        "sunset": sunset,
        "peak_window": peak_window,
        "peak_uv": peak_uv,
    }


async def fetch_location_name(lat: float, lon: float, api_key: str) -> str:
    url = "http://api.openweathermap.org/geo/1.0/reverse"
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params={"lat": lat, "lon": lon, "limit": 1, "appid": api_key})
        response.raise_for_status()
        results = response.json()
        if not results:
            return "Unknown Location"
        place = results[0]
        name = place.get("name", "")
        state = place.get("state", "")
        country = place.get("country", "")
        if state:
            return f"{name}, {state}"
        return f"{name}, {country}"
