import React, { useState, useEffect, useRef } from 'react';
import {
  Sun,
  Cloud,
  CloudRain,
  Moon,
  Wind,
  Droplets,
  ChevronLeft,
  ChevronRight,
  StickyNote,
  Cpu,
  Wifi,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  Flag,
  Sparkles,
} from 'lucide-react';
import './WidgetsCenter.css';

/* ─── helpers ─── */
const pad = (n) => String(n).padStart(2, '0');

/* ===================== WEATHER WIDGET ===================== */
export const WEATHER_ICONS = {
  clear: <Sun size={30} color="#FBBF24" />,
  cloudy: <Cloud size={30} color="#94A3B8" />,
  rain: <CloudRain size={30} color="#60A5FA" />,
  night: <Moon size={30} color="#C4B5FD" />,
};

const DEFAULT_WEATHER = {
  city: 'San Francisco',
  condition: 'Partly Sunny',
  icon: 'clear',
  temp: 22,
  hi: 25,
  lo: 16,
  humidity: 58,
  wind: 12,
  hourly: [
    { label: 'Now', icon: 'clear', temp: 22 },
    { label: '3PM', icon: 'clear', temp: 24 },
    { label: '6PM', icon: 'cloudy', temp: 21 },
    { label: '9PM', icon: 'night', temp: 18 },
    { label: '12AM', icon: 'night', temp: 16 },
  ],
};

export function WeatherWidgetContent() {
  const [data, setData] = useState(DEFAULT_WEATHER);
  const [loading, setLoading] = useState(false);

  // Attempt to fetch real weather from Open-Meteo API using geolocation or fallback
  useEffect(() => {
    let active = true;
    const fetchWeather = async (lat, lon, cityName = 'Current Location') => {
      try {
        setLoading(true);
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&forecast_days=1`
        );
        if (!res.ok) throw new Error('API failed');
        const json = await res.json();
        if (!active) return;

        const current = json.current;
        const temp = Math.round(current.temperature_2m);
        const code = current.weather_code;
        let icon = 'clear';
        let condition = 'Clear Sky';

        if (code >= 51 && code <= 67) {
          icon = 'rain';
          condition = 'Rain';
        } else if (code >= 1 && code <= 3) {
          icon = 'cloudy';
          condition = 'Partly Cloudy';
        } else if (code >= 71) {
          icon = 'cloudy';
          condition = 'Snow / Fog';
        }

        const hourlyTemps = json.hourly?.temperature_2m?.slice(0, 5) || [];
        const hourly = hourlyTemps.map((t, idx) => ({
          label: idx === 0 ? 'Now' : `+${idx * 3}h`,
          icon: icon,
          temp: Math.round(t),
        }));

        setData({
          city: cityName,
          condition,
          icon,
          temp,
          hi: temp + 4,
          lo: temp - 5,
          humidity: current.relative_humidity_2m,
          wind: Math.round(current.wind_speed_10m),
          hourly,
        });
      } catch (err) {
        // Fallback gracefully to default
      } finally {
        if (active) setLoading(false);
      }
    };

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeather(pos.coords.latitude, pos.coords.longitude, 'My Location');
        },
        () => {
          // Fallback to SF coordinates
          fetchWeather(37.7749, -122.4194, 'San Francisco');
        },
        { timeout: 4000 }
      );
    }
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="widget-weather-inner">
      <div className="weather-top">
        <div className="weather-left">
          <div className="weather-city">{data.city}</div>
          <div className="weather-condition">{data.condition}</div>
          <div className="weather-temp">{data.temp}°</div>
          <div className="weather-high-low">H:{data.hi}° L:{data.lo}°</div>
        </div>
        <div className="weather-icon-main">
          {WEATHER_ICONS[data.icon] || WEATHER_ICONS.clear}
        </div>
      </div>
      <div className="weather-extra-row">
        <span><Droplets size={12} style={{ verticalAlign: 'middle' }} /> {data.humidity}%</span>
        <span><Wind size={12} style={{ verticalAlign: 'middle' }} /> {data.wind} km/h</span>
      </div>
      <div className="weather-hourly">
        {data.hourly.map((h, i) => (
          <div key={i} className="weather-hour-col">
            <span>{h.label}</span>
            <span style={{ fontSize: '0.95rem' }}>{WEATHER_ICONS[h.icon]}</span>
            <span>{h.temp}°</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===================== CLOCK WIDGET ===================== */
export const WORLD_ZONES = [
  { name: 'NYC', offset: -4 },
  { name: 'LON', offset: 1 },
  { name: 'TKY', offset: 9 },
  { name: 'SYD', offset: 10 },
];

function getHandAngles(date) {
  const h = date.getHours() % 12;
  const m = date.getMinutes();
  const s = date.getSeconds();
  return {
    hour: (h / 12) * 360 + (m / 60) * 30,
    minute: (m / 60) * 360 + (s / 60) * 6,
    second: (s / 60) * 360,
  };
}

export function AnalogClock({ date, size = 68 }) {
  const angles = getHandAngles(date);
  return (
    <div className="analog-face" style={{ width: size, height: size }}>
      <div className="clock-hand clock-hand--hour" style={{ transform: `translateX(-50%) rotate(${angles.hour}deg)` }} />
      <div className="clock-hand clock-hand--minute" style={{ transform: `translateX(-50%) rotate(${angles.minute}deg)` }} />
      <div className="clock-hand clock-hand--second" style={{ transform: `translateX(-50%) rotate(${angles.second}deg)` }} />
      <div className="clock-center-pin" />
    </div>
  );
}

export function getWorldTime(offset, baseDate) {
  const utc = baseDate.getTime() + baseDate.getTimezoneOffset() * 60000;
  const zoneDate = new Date(utc + offset * 3600000);
  return `${pad(zoneDate.getHours())}:${pad(zoneDate.getMinutes())}`;
}

export function ClockWidgetContent() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const ampm = now.getHours() < 12 ? 'AM' : 'PM';

  return (
    <div className="widget-clock-inner">
      <div className="clock-main-row">
        <AnalogClock date={now} />
        <div className="clock-digital-info">
          <span className="clock-city-name">Local Time</span>
          <span className="clock-big-time">{timeStr}</span>
          <span className="clock-delta">
            {ampm} · {now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
      <div className="world-clocks-mini">
        {WORLD_ZONES.map((z) => (
          <div key={z.name} className="world-clock-item">
            <span className="world-clock-name">{z.name}</span>
            <span className="world-clock-time">{getWorldTime(z.offset, now)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===================== STOPWATCH WIDGET ===================== */
export function StopwatchWidgetContent() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState([]);
  const timerRef = useRef(null);
  const startRef = useRef(0);

  useEffect(() => {
    if (running) {
      startRef.current = Date.now() - elapsed;
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - startRef.current);
      }, 30);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [running]);

  const handleToggle = () => setRunning((r) => !r);

  const handleReset = () => {
    setRunning(false);
    setElapsed(0);
    setLaps([]);
  };

  const handleLap = () => {
    if (!running) return;
    setLaps((prev) => [elapsed, ...prev.slice(0, 3)]);
  };

  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  const millis = Math.floor((elapsed % 1000) / 10);

  const fmt = (ms) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const ms10 = Math.floor((ms % 1000) / 10);
    return `${pad(m)}:${pad(s)}.${pad(ms10)}`;
  };

  return (
    <div className="widget-stopwatch-inner" style={{ padding: '0.2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Stopwatch
        </span>
        <span style={{ fontSize: '0.72rem', color: running ? '#34C759' : 'var(--text-muted)' }}>
          {running ? '● Running' : 'Paused'}
        </span>
      </div>

      <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
        <span style={{ fontSize: '2.1rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
          {pad(minutes)}:{pad(seconds)}
          <span style={{ fontSize: '1.25rem', opacity: 0.65 }}>.{pad(millis)}</span>
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginTop: '0.6rem' }}>
        <button
          onClick={handleToggle}
          style={{
            background: running ? 'rgba(239, 68, 68, 0.18)' : 'rgba(52, 199, 89, 0.18)',
            color: running ? '#EF4444' : '#34C759',
            border: `1px solid ${running ? 'rgba(239, 68, 68, 0.3)' : 'rgba(52, 199, 89, 0.3)'}`,
            padding: '0.4rem 0.9rem',
            borderRadius: '16px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          {running ? <Pause size={13} /> : <Play size={13} />}
          {running ? 'Pause' : 'Start'}
        </button>

        {running && (
          <button
            onClick={handleLap}
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-medium)',
              padding: '0.4rem 0.8rem',
              borderRadius: '16px',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <Flag size={12} /> Lap
          </button>
        )}

        {elapsed > 0 && !running && (
          <button
            onClick={handleReset}
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-medium)',
              padding: '0.4rem 0.8rem',
              borderRadius: '16px',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>

      {laps.length > 0 && (
        <div style={{ marginTop: '0.6rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.4rem' }}>
          {laps.map((lap, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.15rem 0' }}>
              <span>Lap {laps.length - i}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(lap)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===================== CALENDAR WIDGET ===================== */
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function CalendarWidgetContent() {
  const today = new Date();
  const [viewed, setViewed] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const firstDay = new Date(viewed.year, viewed.month, 1).getDay();
  const daysInMonth = new Date(viewed.year, viewed.month + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewed.year, viewed.month, 0).getDate();

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, other: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate() && viewed.month === today.getMonth() && viewed.year === today.getFullYear();
    cells.push({ day: d, today: isToday });
  }
  let fill = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: fill++, other: true });
  }

  const prevMonth = (e) => {
    e?.stopPropagation?.();
    setViewed((v) => {
      const m = v.month === 0 ? 11 : v.month - 1;
      const y = v.month === 0 ? v.year - 1 : v.year;
      return { year: y, month: m };
    });
  };
  const nextMonth = (e) => {
    e?.stopPropagation?.();
    setViewed((v) => {
      const m = v.month === 11 ? 0 : v.month + 1;
      const y = v.month === 11 ? v.year + 1 : v.year;
      return { year: y, month: m };
    });
  };

  return (
    <div className="widget-calendar-inner">
      <div className="calendar-header">
        <button className="widget-nav-btn" onClick={prevMonth} aria-label="Previous month">
          <ChevronLeft size={14} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div className="calendar-month-name">{MONTHS[viewed.month]}</div>
          <div className="calendar-day-big">{viewed.year}</div>
        </div>
        <button className="widget-nav-btn" onClick={nextMonth} aria-label="Next month">
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="calendar-weekdays">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="calendar-days-grid">
        {cells.map((cell, i) => (
          <div
            key={i}
            className={`calendar-day-cell${cell.today ? ' calendar-day-cell--today' : ''}${
              cell.other ? ' calendar-day-cell--other' : ''
            }`}
          >
            {cell.day}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===================== STICKY NOTES WIDGET ===================== */
const NOTES_KEY = 'vyom_widget_notes_v1';
export function StickyNotesWidgetContent() {
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem(NOTES_KEY) || '🎯 Goals for today:\n• Build Vyom OS apps\n• Add widgets on desktop\n• Test camera & photos';
    } catch {
      return '';
    }
  });

  const handleChange = (e) => {
    setText(e.target.value);
    try {
      localStorage.setItem(NOTES_KEY, e.target.value);
    } catch {}
  };

  return (
    <div className="widget-notes-inner">
      <div className="notes-header">
        <StickyNote size={12} />
        Quick Notes
      </div>
      <textarea
        className="notes-textarea"
        placeholder="Write note here..."
        value={text}
        onChange={handleChange}
        onPointerDown={(e) => e.stopPropagation()}
      />
    </div>
  );
}

/* ===================== SYSTEM STATS WIDGET ===================== */
export function SystemStatsWidgetContent() {
  const [vol, setVol] = useState(75);

  return (
    <div className="widget-battery-inner">
      <div
        style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.5rem',
        }}
      >
        System
      </div>

      {/* Volume */}
      <div className="battery-row" style={{ marginBottom: '0.5rem' }}>
        <div className="battery-badge-gauge">
          <div className="battery-icon-wrap" style={{ background: 'rgba(0,122,255,0.12)', color: '#007AFF' }}>
            <Volume2 size={16} />
          </div>
          <div>
            <div className="battery-val">{vol}%</div>
            <div className="battery-sub">Audio Volume</div>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={vol}
          onChange={(e) => setVol(Number(e.target.value))}
          onPointerDown={(e) => e.stopPropagation()}
          style={{ width: 75, accentColor: '#007AFF', cursor: 'pointer' }}
        />
      </div>

      {/* Wifi */}
      <div className="battery-row" style={{ marginBottom: '0.5rem' }}>
        <div className="battery-badge-gauge">
          <div className="battery-icon-wrap" style={{ background: 'rgba(52,199,89,0.12)', color: '#34C759' }}>
            <Wifi size={16} />
          </div>
          <div>
            <div className="battery-val">Connected</div>
            <div className="battery-sub">Vyom Wireless</div>
          </div>
        </div>
      </div>

      {/* CPU */}
      <div className="battery-row">
        <div className="battery-badge-gauge">
          <div className="battery-icon-wrap" style={{ background: 'rgba(255,149,0,0.12)', color: '#FF9500' }}>
            <Cpu size={16} />
          </div>
          <div>
            <div className="battery-val">{navigator.hardwareConcurrency || 8} cores</div>
            <div className="battery-sub">Hardware Threads</div>
          </div>
        </div>
      </div>
    </div>
  );
}
