const FORECAST_TTL_MS = 15 * 60 * 1000;
const forecastCache = new Map();

function hourKey(date, time) {
  const hour = Number(String(time || '00:00').split(':')[0] || 0);
  return `${date}T${String(hour).padStart(2, '0')}:00`;
}

async function fetchForecast(lat, lon) {
  const cacheKey = `${lat.toFixed(3)}:${lon.toFixed(3)}`;
  const cached = forecastCache.get(cacheKey);

  if (cached && Date.now() - cached.createdAt < FORECAST_TTL_MS) {
    return cached.payload;
  }

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: 'auto',
    hourly: 'weathercode,temperature_2m',
    forecast_days: '7'
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Impossibile recuperare il meteo');
  }

  const payload = await response.json();
  forecastCache.set(cacheKey, { payload, createdAt: Date.now() });
  return payload;
}

export async function getWeatherForSlot({ lat, lon, date, startTime }) {
  if (!lat || !lon || !date) return null;

  const payload = await fetchForecast(lat, lon);
  const targetHour = hourKey(date, startTime);
  const hourly = payload?.hourly;

  if (!hourly?.time?.length) return null;

  const index = hourly.time.findIndex((value) => value.startsWith(targetHour));
  if (index === -1) return null;

  return {
    weatherCode: hourly.weathercode?.[index],
    temperature: hourly.temperature_2m?.[index]
  };
}
