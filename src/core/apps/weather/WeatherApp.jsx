import React, { useState, useEffect } from 'react';
import {
  Sun,
  Cloud,
  CloudRain,
  Moon,
  Wind,
  Droplets,
  Eye,
  Compass,
  Gauge,
  Sunrise,
  Sunset,
} from 'lucide-react';
import './WeatherApp.css';

const PRESET_CITIES = [
  { name: 'San Francisco', lat: 37.7749, lon: -122.4194 },
  { name: 'New York', lat: 40.7128, lon: -74.006 },
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { name: 'Paris', lat: 48.8566, lon: 2.3522 },
  { name: 'Delhi', lat: 28.6139, lon: 77.209 },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
];

const getWeatherIcon = (code, isDay = 1) => {
  if (code >= 51 && code <= 67) return <CloudRain size={24} color="#60A5FA" />;
  if (code >= 1 && code <= 3) return <Cloud size={24} color="#CBD5E1" />;
  if (code >= 71) return <Cloud size={24} color="#E2E8F0" />;
  return isDay ? <Sun size={24} color="#FBBF24" /> : <Moon size={24} color="#C4B5FD" />;
};

const getWeatherConditionText = (code) => {
  if (code === 0) return 'Clear Sky';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  return 'Thunderstorms';
};

export default function WeatherApp() {
  const [selectedCity, setSelectedCity] = useState(PRESET_CITIES[0]);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchCityWeather = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${selectedCity.lat}&longitude=${selectedCity.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,surface_pressure&hourly=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
        );
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        if (!active) return;
        setWeatherData(json);
      } catch (err) {
        console.warn('Weather fetch failed', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCityWeather();
    return () => {
      active = false;
    };
  }, [selectedCity]);

  const current = weatherData?.current;
  const currentTemp = current ? Math.round(current.temperature_2m) : 22;
  const conditionCode = current ? current.weather_code : 0;
  const isDay = current ? current.is_day : 1;
  const hi = weatherData?.daily?.temperature_2m_max?.[0] ? Math.round(weatherData.daily.temperature_2m_max[0]) : currentTemp + 4;
  const lo = weatherData?.daily?.temperature_2m_min?.[0] ? Math.round(weatherData.daily.temperature_2m_min[0]) : currentTemp - 4;

  const bgClass = !isDay ? 'weather-app--night' : conditionCode >= 51 ? 'weather-app--rain' : '';

  // Hourly items
  const hourlyTimes = weatherData?.hourly?.time?.slice(0, 12) || [];
  const hourlyTemps = weatherData?.hourly?.temperature_2m?.slice(0, 12) || [];
  const hourlyCodes = weatherData?.hourly?.weather_code?.slice(0, 12) || [];
  const hourlyIsDay = weatherData?.hourly?.is_day?.slice(0, 12) || [];

  // Daily items (7-day)
  const dailyDates = weatherData?.daily?.time?.slice(0, 7) || [];
  const dailyMax = weatherData?.daily?.temperature_2m_max?.slice(0, 7) || [];
  const dailyMin = weatherData?.daily?.temperature_2m_min?.slice(0, 7) || [];
  const dailyCodes = weatherData?.daily?.weather_code?.slice(0, 7) || [];

  return (
    <div className={`weather-app ${bgClass}`}>
      {/* City Bar */}
      <div className="weather-search-bar">
        {PRESET_CITIES.map((c) => (
          <button
            key={c.name}
            className={`weather-city-btn ${selectedCity.name === c.name ? 'weather-city-btn--active' : ''}`}
            onClick={() => setSelectedCity(c)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Hero Display */}
      <div className="weather-hero">
        <h1 className="weather-hero-city">{selectedCity.name}</h1>
        <div className="weather-hero-temp">{currentTemp}°</div>
        <div className="weather-hero-cond">{getWeatherConditionText(conditionCode)}</div>
        <div className="weather-hero-hilow">
          H:{hi}° · L:{lo}°
        </div>
      </div>

      {/* Hourly Forecast */}
      <div className="weather-section-card">
        <div className="weather-card-title">Hourly Forecast</div>
        <div className="weather-hourly-list">
          {hourlyTimes.map((t, idx) => {
            const timeDate = new Date(t);
            const hourStr = idx === 0 ? 'Now' : timeDate.toLocaleTimeString([], { hour: 'numeric' });
            return (
              <div key={t} className="weather-hourly-col">
                <span>{hourStr}</span>
                <span>{getWeatherIcon(hourlyCodes[idx], hourlyIsDay[idx])}</span>
                <span style={{ fontWeight: 600 }}>{Math.round(hourlyTemps[idx])}°</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div className="weather-section-card">
        <div className="weather-card-title">7-Day Forecast</div>
        {dailyDates.map((d, idx) => {
          const dayName = idx === 0 ? 'Today' : new Date(d).toLocaleDateString([], { weekday: 'short' });
          return (
            <div key={d} className="weather-daily-row">
              <span style={{ width: 60, fontWeight: 500 }}>{dayName}</span>
              <span>{getWeatherIcon(dailyCodes[idx], 1)}</span>
              <span style={{ opacity: 0.7 }}>L: {Math.round(dailyMin[idx])}°</span>
              <span style={{ fontWeight: 600 }}>H: {Math.round(dailyMax[idx])}°</span>
            </div>
          );
        })}
      </div>

      {/* Weather Metrics Grid */}
      <div className="weather-metrics-grid">
        <div className="weather-metric-box">
          <div className="weather-metric-label">
            <Droplets size={12} style={{ verticalAlign: 'middle' }} /> Humidity
          </div>
          <div className="weather-metric-val">{current ? current.relative_humidity_2m : 55}%</div>
        </div>

        <div className="weather-metric-box">
          <div className="weather-metric-label">
            <Wind size={12} style={{ verticalAlign: 'middle' }} /> Wind Speed
          </div>
          <div className="weather-metric-val">{current ? Math.round(current.wind_speed_10m) : 12} km/h</div>
        </div>

        <div className="weather-metric-box">
          <div className="weather-metric-label">
            <Gauge size={12} style={{ verticalAlign: 'middle' }} /> Pressure
          </div>
          <div className="weather-metric-val">{current ? Math.round(current.surface_pressure) : 1014} hPa</div>
        </div>

        <div className="weather-metric-box">
          <div className="weather-metric-label">
            <Compass size={12} style={{ verticalAlign: 'middle' }} /> Feels Like
          </div>
          <div className="weather-metric-val">
            {current?.apparent_temperature ? Math.round(current.apparent_temperature) : currentTemp}°
          </div>
        </div>
      </div>
    </div>
  );
}
