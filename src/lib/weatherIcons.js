import { Cloud, CloudFog, CloudRain, CloudSnow, Sun, Wind } from 'lucide-react';

export function getWeatherVisual(weatherCode) {
  if (weatherCode === 0) {
    return { Icon: Sun, label: 'Sereno' };
  }

  if ([1, 2, 3].includes(weatherCode)) {
    return { Icon: Cloud, label: 'Nuvoloso' };
  }

  if ([45, 48].includes(weatherCode)) {
    return { Icon: CloudFog, label: 'Nebbia' };
  }

  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)) {
    return { Icon: CloudRain, label: 'Pioggia' };
  }

  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return { Icon: CloudSnow, label: 'Neve' };
  }

  if ([95, 96, 99].includes(weatherCode)) {
    return { Icon: Wind, label: 'Temporale' };
  }

  return { Icon: Cloud, label: 'Meteo' };
}
