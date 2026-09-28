import React, { useState, useEffect, useRef } from 'react';
import { Globe, Timer, Hourglass, Plus, Bell, Play, Pause, RotateCcw, Flag } from 'lucide-react';
import { AnalogClock, getWorldTime } from '../../widgets/WidgetComponents';
import './ClockApp.css';

const pad = (n) => String(n).padStart(2, '0');

const CITIES = [
  { name: 'Cupertino', offset: -7 },
  { name: 'New York', offset: -4 },
  { name: 'London', offset: 1 },
  { name: 'Paris', offset: 2 },
  { name: 'Delhi', offset: 5.5 },
  { name: 'Tokyo', offset: 9 },
  { name: 'Sydney', offset: 10 },
];

export default function ClockApp() {
  const [activeTab, setActiveTab] = useState('world'); // 'world' | 'stopwatch' | 'timer'

  // Time ticker
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ─── Stopwatch state ─── */
  const [swRunning, setSwRunning] = useState(false);
  const [swElapsed, setSwElapsed] = useState(0);
  const [swLaps, setSwLaps] = useState([]);
  const swTimerRef = useRef(null);
  const swStartRef = useRef(0);

  useEffect(() => {
    if (swRunning) {
      swStartRef.current = Date.now() - swElapsed;
      swTimerRef.current = setInterval(() => {
        setSwElapsed(Date.now() - swStartRef.current);
      }, 25);
    } else {
      clearInterval(swTimerRef.current);
    }
    return () => clearInterval(swTimerRef.current);
  }, [swRunning]);

  const toggleStopwatch = () => setSwRunning((r) => !r);
  const resetStopwatch = () => {
    setSwRunning(false);
    setSwElapsed(0);
    setSwLaps([]);
  };
  const lapStopwatch = () => {
    if (!swRunning) return;
    setSwLaps((laps) => [swElapsed, ...laps]);
  };

  const swMin = Math.floor(swElapsed / 60000);
  const swSec = Math.floor((swElapsed % 60000) / 1000);
  const swMs = Math.floor((swElapsed % 1000) / 10);

  const formatLap = (ms) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const m10 = Math.floor((ms % 1000) / 10);
    return `${pad(m)}:${pad(s)}.${pad(m10)}`;
  };

  /* ─── Timer state ─── */
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRemaining, setTimerRemaining] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setTimerRunning(false);
            // Alert sound
            try {
              const AudioCtx = window.AudioContext || window.webkitAudioContext;
              if (AudioCtx) {
                const ctx = new AudioCtx();
                const osc = ctx.createOscillator();
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                osc.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.4);
              }
            } catch (e) {}
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [timerRunning]);

  const startTimer = () => {
    setTimerRemaining(Number(timerMinutes) * 60 + Number(timerSeconds));
    setTimerRunning(true);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimerRemaining(Number(timerMinutes) * 60 + Number(timerSeconds));
  };

  const timerDispMin = Math.floor(timerRemaining / 60);
  const timerDispSec = timerRemaining % 60;

  return (
    <div className="clock-app">
      {/* Tab Navigation */}
      <div className="clock-tab-bar">
        <button
          className={`clock-tab-btn ${activeTab === 'world' ? 'clock-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('world')}
        >
          <Globe size={14} /> World Clock
        </button>
        <button
          className={`clock-tab-btn ${activeTab === 'stopwatch' ? 'clock-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('stopwatch')}
        >
          <Timer size={14} /> Stopwatch
        </button>
        <button
          className={`clock-tab-btn ${activeTab === 'timer' ? 'clock-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('timer')}
        >
          <Hourglass size={14} /> Timer
        </button>
      </div>

      {/* Main Content Area */}
      <div className="clock-content">
        {/* WORLD CLOCK TAB */}
        {activeTab === 'world' && (
          <div className="world-clock-grid">
            {CITIES.map((c) => {
              const timeStr = getWorldTime(c.offset, now);
              return (
                <div key={c.name} className="world-clock-card">
                  <div className="world-clock-left">
                    <span className="world-clock-city">{c.name}</span>
                    <span className="world-clock-diff">
                      {c.offset >= 0 ? `+${c.offset} HRS` : `${c.offset} HRS`}
                    </span>
                    <span className="world-clock-digi">{timeStr}</span>
                  </div>
                  <AnalogClock
                    date={new Date(now.getTime() + (now.getTimezoneOffset() + c.offset * 60) * 60000)}
                    size={64}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* STOPWATCH TAB */}
        {activeTab === 'stopwatch' && (
          <div className="stopwatch-view">
            <div className="stopwatch-display">
              {pad(swMin)}:{pad(swSec)}
              <span className="stopwatch-millis">.{pad(swMs)}</span>
            </div>

            <div className="stopwatch-controls">
              {swRunning ? (
                <button
                  className="stopwatch-btn stopwatch-btn--secondary"
                  onClick={lapStopwatch}
                >
                  <Flag size={18} style={{ marginRight: '0.3rem' }} /> Lap
                </button>
              ) : (
                <button
                  className="stopwatch-btn stopwatch-btn--secondary"
                  onClick={resetStopwatch}
                >
                  <RotateCcw size={18} style={{ marginRight: '0.3rem' }} /> Reset
                </button>
              )}

              <button
                className={`stopwatch-btn ${swRunning ? 'stopwatch-btn--stop' : 'stopwatch-btn--start'}`}
                onClick={toggleStopwatch}
              >
                {swRunning ? 'Stop' : 'Start'}
              </button>
            </div>

            {swLaps.length > 0 && (
              <div className="stopwatch-laps-table">
                {swLaps.map((lap, idx) => (
                  <div key={idx} className="stopwatch-lap-row">
                    <span>Lap {swLaps.length - idx}</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                      {formatLap(lap)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TIMER TAB */}
        {activeTab === 'timer' && (
          <div className="timer-view">
            {!timerRunning && timerRemaining === Number(timerMinutes) * 60 + Number(timerSeconds) ? (
              <div className="timer-inputs">
                <div className="timer-input-box">
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="timer-num-input"
                  />
                  <span className="timer-num-label">Min</span>
                </div>
                <span style={{ fontSize: '2rem', fontWeight: 300 }}>:</span>
                <div className="timer-input-box">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={timerSeconds}
                    onChange={(e) => setTimerSeconds(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="timer-num-input"
                  />
                  <span className="timer-num-label">Sec</span>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '4.8rem', fontWeight: 200, fontVariantNumeric: 'tabular-nums' }}>
                {pad(timerDispMin)}:{pad(timerDispSec)}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
              <button
                className="stopwatch-btn stopwatch-btn--secondary"
                onClick={resetTimer}
              >
                <RotateCcw size={18} />
              </button>

              <button
                className={`stopwatch-btn ${timerRunning ? 'stopwatch-btn--stop' : 'stopwatch-btn--start'}`}
                onClick={timerRunning ? () => setTimerRunning(false) : startTimer}
              >
                {timerRunning ? 'Pause' : 'Start'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
