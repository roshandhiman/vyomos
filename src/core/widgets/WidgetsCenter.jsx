import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Wind, Droplets, Sun, Cloud, CloudRain, Moon, ChevronLeft, ChevronRight, StickyNote, Cpu, Wifi, Battery, Volume2 } from 'lucide-react';
import './WidgetsCenter.css';

/* ─── tiny helpers ─── */
const pad = (n) => String(n).padStart(2, '0');

/* ===================== WEATHER WIDGET ===================== */
const WEATHER_ICONS = {
  clear: <Sun size={32} color="#FBBF24" />, 
  cloudy: <Cloud size={32} color="#94A3B8" />, 
  rain: <CloudRain size={32} color="#60A5FA" />,
  night: <Moon size={32} color="#C4B5FD" />,
};

// Mock weather (no API key needed)
const MOCK_WEATHER = {
  city: 'Your City',
  condition: 'Partly Cloudy',
  icon: 'cloudy',
  temp: 24,
  hi: 28,
  lo: 18,
  humidity: 62,
  wind: 14,
  hourly: [
    { label: 'Now', icon: 'cloudy', temp: 24 },
    { label: '3PM', icon: 'clear', temp: 27 },
    { label: '6PM', icon: 'clear', temp: 26 },
    { label: '9PM', icon: 'night', temp: 21 },
    { label: '12AM', icon: 'night', temp: 19 },
  ],
};

function WeatherWidget() {
  const w = MOCK_WEATHER;
  return (
    <div className="widget-card widget-weather">
      <div className="weather-top">
        <div className="weather-left">
          <div className="weather-city">{w.city}</div>
          <div className="weather-condition">{w.condition}</div>
          <div className="weather-temp">{w.temp}°</div>
          <div className="weather-high-low">H:{w.hi}° L:{w.lo}°</div>
        </div>
        <div className="weather-icon-main">
          {WEATHER_ICONS[w.icon]}
        </div>
      </div>
      <div className="weather-extra-row">
        <span><Droplets size={12} style={{ verticalAlign: 'middle' }} /> {w.humidity}%</span>
        <span><Wind size={12} style={{ verticalAlign: 'middle' }} /> {w.wind} km/h</span>
      </div>
      <div className="weather-hourly">
        {w.hourly.map((h, i) => (
          <div key={i} className="weather-hour-col">
            <span>{h.label}</span>
            <span style={{ fontSize: '1rem' }}>{WEATHER_ICONS[h.icon]}</span>
            <span>{h.temp}°</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===================== CLOCK WIDGET ===================== */
const WORLD_ZONES = [
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

function AnalogClock({ date }) {
  const angles = getHandAngles(date);
  return (
    <div className="analog-face">
      <div className="clock-hand clock-hand--hour" style={{ transform: `translateX(-50%) rotate(${angles.hour}deg)` }} />
      <div className="clock-hand clock-hand--minute" style={{ transform: `translateX(-50%) rotate(${angles.minute}deg)` }} />
      <div className="clock-hand clock-hand--second" style={{ transform: `translateX(-50%) rotate(${angles.second}deg)` }} />
      <div className="clock-center-pin" />
    </div>
  );
}

function getWorldTime(offset, baseDate) {
  const utc = baseDate.getTime() + baseDate.getTimezoneOffset() * 60000;
  const zoneDate = new Date(utc + offset * 3600000);
  return `${pad(zoneDate.getHours())}:${pad(zoneDate.getMinutes())}`;
}

function ClockWidget() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const ampm = now.getHours() < 12 ? 'AM' : 'PM';

  return (
    <div className="widget-card widget-clock">
      <div className="clock-main-row">
        <AnalogClock date={now} />
        <div className="clock-digital-info">
          <span className="clock-city-name">Local Time</span>
          <span className="clock-big-time">{timeStr}</span>
          <span className="clock-delta">{ampm} · {now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
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

/* ===================== CALENDAR WIDGET ===================== */
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function CalendarWidget() {
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

  const prevMonth = () => {
    setViewed(v => {
      const m = v.month === 0 ? 11 : v.month - 1;
      const y = v.month === 0 ? v.year - 1 : v.year;
      return { year: y, month: m };
    });
  };
  const nextMonth = () => {
    setViewed(v => {
      const m = v.month === 11 ? 0 : v.month + 1;
      const y = v.month === 11 ? v.year + 1 : v.year;
      return { year: y, month: m };
    });
  };

  return (
    <div className="widget-card widget-calendar">
      <div className="calendar-header">
        <button className="widget-nav-btn" onClick={prevMonth}><ChevronLeft size={14} /></button>
        <div style={{ textAlign: 'center' }}>
          <div className="calendar-month-name">{MONTHS[viewed.month]}</div>
          <div className="calendar-day-big">{viewed.year}</div>
        </div>
        <button className="widget-nav-btn" onClick={nextMonth}><ChevronRight size={14} /></button>
      </div>
      <div className="calendar-weekdays">
        {WEEKDAYS.map(d => <span key={d}>{d}</span>)}
      </div>
      <div className="calendar-days-grid">
        {cells.map((cell, i) => (
          <div
            key={i}
            className={`calendar-day-cell${cell.today ? ' calendar-day-cell--today' : ''}${cell.other ? ' calendar-day-cell--other' : ''}`}
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
function StickyNotesWidget() {
  const [text, setText] = useState(() => {
    try { return localStorage.getItem(NOTES_KEY) || ''; } catch { return ''; }
  });

  const handleChange = (e) => {
    setText(e.target.value);
    try { localStorage.setItem(NOTES_KEY, e.target.value); } catch {}
  };

  return (
    <div className="widget-card widget-notes">
      <div className="notes-header">
        <StickyNote size={12} />
        Quick Notes
      </div>
      <textarea
        className="notes-textarea"
        placeholder="Write something..."
        value={text}
        onChange={handleChange}
      />
    </div>
  );
}

/* ===================== SYSTEM STATS WIDGET ===================== */
function SystemStatsWidget() {
  // Static / estimated values – real stats require native access
  const [vol, setVol] = useState(70);

  return (
    <div className="widget-card widget-battery">
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
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
            <div className="battery-sub">Volume</div>
          </div>
        </div>
        <input
          type="range" min={0} max={100} value={vol}
          onChange={e => setVol(Number(e.target.value))}
          style={{ width: 80, accentColor: '#007AFF', cursor: 'pointer' }}
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
            <div className="battery-sub">Wi-Fi</div>
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
            <div className="battery-val">{navigator.hardwareConcurrency || '?'} cores</div>
            <div className="battery-sub">CPU</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== MAIN PANEL ===================== */
export default function WidgetsCenter({ onClose }) {
  const backdropRef = useRef(null);

  // Close on backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (e.target === backdropRef.current) onClose?.();
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const now = new Date();
  const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="widgets-backdrop" ref={backdropRef} onClick={handleBackdropClick}>
      <aside className="widgets-center-panel" role="complementary" aria-label="Widgets Center">
        {/* Header */}
        <div className="widgets-header">
          <div className="widgets-header-left">
            <span className="widgets-title">Widgets</span>
            <span className="widgets-subtitle">{dateStr}</span>
          </div>
          <button className="widgets-close-btn" onClick={onClose} aria-label="Close Widgets">
            <X size={13} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="widgets-scroll-area">
          <WeatherWidget />
          <ClockWidget />
          <CalendarWidget />
          <StickyNotesWidget />
          <SystemStatsWidget />
        </div>
      </aside>
    </div>
  );
}
