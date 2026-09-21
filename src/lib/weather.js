const API_URL = 'https://api.open-meteo.com/v1/forecast';

export async function getWeather(latitude, longitude) {
  const url =
    `${API_URL}?latitude=${latitude}` +
    `&longitude=${longitude}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max` +
    `&timezone=auto` +
    `&forecast_days=7`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Gagal mengambil data cuaca');
  }

  return await response.json();
}

export function getWeatherText(code) {
  if (code === 0) return 'Cerah';
  if ([1, 2, 3].includes(code)) return 'Berawan';
  if ([45, 48].includes(code)) return 'Berkabut';
  if ([51, 53, 55].includes(code)) return 'Gerimis';
  if ([61, 63, 65].includes(code)) return 'Hujan';
  if ([66, 67].includes(code)) return 'Hujan membeku';
  if ([71, 73, 75, 77].includes(code)) return 'Salju';
  if ([80, 81, 82].includes(code)) return 'Hujan deras';
  if ([85, 86].includes(code)) return 'Hujan salju';
  if ([95, 96, 99].includes(code)) return 'Badai petir';

  return 'Tidak diketahui';
}