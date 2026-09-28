import React, { useMemo } from 'react';
import {
  useSettingsStore,
  ACCENT_PRESETS,
  WALLPAPER_PRESETS,
} from '../../store/settings';
import {
  Palette,
  Zap,
  Monitor,
  Sparkles,
  Cpu,
} from 'lucide-react';
import './SettingsApp.css';

export default function SettingsApp() {
  const {
    accentId,
    wallpaper,
    cursorGlow,
    dockMagnification,
    animations,
    performanceMode,
    setAccent,
    setWallpaper,
    toggleCursorGlow,
    toggleDockMagnification,
    toggleAnimations,
    setPerformanceMode,
  } = useSettingsStore();

  const systemInfo = useMemo(() => {
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 'N/A' : 'N/A';
    // @ts-ignore
    const memory = typeof navigator !== 'undefined' && navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'N/A';
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
    const isMac = userAgent.includes('Mac');
    const isWindows = userAgent.includes('Win');
    const isLinux = userAgent.includes('Linux');
    const os = isMac ? 'macOS' : isWindows ? 'Windows' : isLinux ? 'Linux' : 'Vyom OS Host';

    return { cores, memory, os };
  }, []);

  return (
    <div className="settings-app">
      <div className="settings-header">
        <h1>
          <Palette size={20} color="var(--accent-primary)" />
          Settings
        </h1>
        <p>Customize your Vyom OS environment, appearance, and performance</p>
      </div>

      {/* Appearance Section */}
      <div className="settings-section">
        <h3 className="settings-section-title">
          <Monitor size={16} />
          Wallpaper
        </h3>
        <div className="wallpaper-grid">
          {WALLPAPER_PRESETS.map((p) => (
            <div
              key={p.id}
              className={`wallpaper-card ${wallpaper === p.id ? 'wallpaper-card--active' : ''}`}
              style={
                p.url
                  ? {
                    backgroundImage: `url("${p.url}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                  : { backgroundColor: 'var(--bg-desktop)' }
              }
              onClick={() => setWallpaper(p.id)}
            >
              <span className="wallpaper-card-name">{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Accent Color Section */}
      <div className="settings-section">
        <h3 className="settings-section-title">
          <Sparkles size={16} />
          Accent Colors
        </h3>
        <div className="accent-grid">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              className={`accent-btn ${accentId === preset.id ? 'accent-btn--active' : ''}`}
              onClick={() => setAccent(preset.id)}
            >
              <span
                className="accent-preview-swatch"
                style={{
                  background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`,
                }}
              />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Performance Section */}
      <div className="settings-section">
        <h3 className="settings-section-title">
          <Zap size={16} />
          Performance & Graphics
        </h3>
        <div className="settings-card">
          <div className="toggle-row">
            <div className="toggle-info">
              <span className="toggle-label">Master Performance Mode</span>
              <span className="toggle-desc">
                Disables glow shader, animations, and magnification for ultra-smooth 60fps
              </span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={performanceMode}
                onChange={(e) => setPerformanceMode(e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>

          <div className="toggle-row">
            <div className="toggle-info">
              <span className="toggle-label">WebGL Cursor Glow Effect</span>
              <span className="toggle-desc">
                GLSL fluid light trail behind cursor (turns off when idle)
              </span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={cursorGlow && !performanceMode}
                disabled={performanceMode}
                onChange={(e) => toggleCursorGlow(e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>

          <div className="toggle-row">
            <div className="toggle-info">
              <span className="toggle-label">Dock Magnification</span>
              <span className="toggle-desc">
                Physics-based spring expansion on pointer hover
              </span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={dockMagnification && !performanceMode}
                disabled={performanceMode}
                onChange={(e) => toggleDockMagnification(e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>

          <div className="toggle-row">
            <div className="toggle-info">
              <span className="toggle-label">Window Animations</span>
              <span className="toggle-desc">Smooth scale-fade transitions for opening windows</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={animations && !performanceMode}
                disabled={performanceMode}
                onChange={(e) => toggleAnimations(e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="settings-section">
        <h3 className="settings-section-title">
          <Cpu size={16} />
          Device & Environment
        </h3>
        <div className="system-info-grid">
          <div className="info-item">
            <span className="info-item-label">Host Platform</span>
            <span className="info-item-val">{systemInfo.os}</span>
          </div>
          <div className="info-item">
            <span className="info-item-label">CPU Cores</span>
            <span className="info-item-val">{systemInfo.cores} threads</span>
          </div>
          <div className="info-item">
            <span className="info-item-label">Detected RAM</span>
            <span className="info-item-val">{systemInfo.memory}</span>
          </div>
          <div className="info-item">
            <span className="info-item-label">Vyom OS Version</span>
            <span className="info-item-val">1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
