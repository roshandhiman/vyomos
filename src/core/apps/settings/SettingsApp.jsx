import React, { useState, useMemo } from 'react';
import {
  useSettingsStore,
  ACCENT_PRESETS,
  WALLPAPER_PRESETS,
} from '../../store/settings';
import { useFsStore } from '../../store/fs';
import {
  Palette,
  Layout,
  Image as ImageIcon,
  MousePointer,
  HardDrive,
  Info,
  Search,
  Check,
  RotateCcw,
  Sparkles,
  Cpu,
  Monitor,
} from 'lucide-react';
import './SettingsApp.css';

const SECTIONS = [
  { id: 'appearance', label: 'Appearance', icon: Palette, bg: 'linear-gradient(135deg, #007AFF, #5856D6)' },
  { id: 'dock', label: 'Desktop & Dock', icon: Layout, bg: 'linear-gradient(135deg, #FF9500, #FF5E3A)' },
  { id: 'wallpaper', label: 'Wallpaper', icon: ImageIcon, bg: 'linear-gradient(135deg, #AF52DE, #5856D6)' },
  { id: 'pointer', label: 'Cursor & Graphics', icon: MousePointer, bg: 'linear-gradient(135deg, #32ADE6, #007AFF)' },
  { id: 'storage', label: 'Storage & Files', icon: HardDrive, bg: 'linear-gradient(135deg, #8E8E93, #636366)' },
  { id: 'about', label: 'General & About', icon: Info, bg: 'linear-gradient(135deg, #48484A, #1C1C1E)' },
];

export default function SettingsApp() {
  const [activeSection, setActiveSection] = useState('appearance');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    themeMode,
    accentId,
    wallpaper,
    cursorGlow,
    dockSize,
    dockMagnification,
    dockMagScale,
    dockPosition,
    dockAutoHide,
    dockShowIndicators,
    dockStyle,
    animations,
    performanceMode,
    setThemeMode,
    setAccent,
    setWallpaper,
    setDockSize,
    toggleDockMagnification,
    setDockMagScale,
    setDockPosition,
    toggleDockAutoHide,
    toggleDockShowIndicators,
    setDockStyle,
    toggleCursorGlow,
    toggleAnimations,
    setPerformanceMode,
  } = useSettingsStore();

  const fsNodes = useFsStore((state) => state.nodes);
  const initFs = useFsStore((state) => state.initFs);

  const activeWallpaper = useMemo(() => {
    return WALLPAPER_PRESETS.find((p) => p.id === wallpaper) || WALLPAPER_PRESETS[0];
  }, [wallpaper]);

  const fsStats = useMemo(() => {
    const all = Object.values(fsNodes || {});
    const files = all.filter((n) => n.type === 'file');
    const folders = all.filter((n) => n.type === 'folder');
    const totalBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
    return {
      fileCount: files.length,
      folderCount: folders.length,
      totalBytes,
    };
  }, [fsNodes]);

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

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return SECTIONS;
    const q = searchQuery.toLowerCase();
    return SECTIONS.filter((s) => s.label.toLowerCase().includes(q));
  }, [searchQuery]);

  const handleResetVfs = () => {
    if (window.confirm('Reset Vyom OS file system to defaults? All custom files will be restored.')) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('devos_vfs_tree_v2');
      }
      initFs();
    }
  };

  return (
    <div className="macos-settings">
      {/* ==================== LEFT SIDEBAR ==================== */}
      <aside className="macos-settings-sidebar">
        {/* Search */}
        <div className="macos-search-box">
          <Search size={13} />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Profile Card */}
        <div className="macos-profile-card">
          <div className="macos-avatar">V</div>
          <div className="macos-profile-info">
            <span className="macos-profile-name">Vyom OS User</span>
            <span className="macos-profile-sub">Local Administrator</span>
          </div>
        </div>

        {/* Nav List */}
        <nav className="macos-nav-list">
          {filteredSections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <div
                key={sec.id}
                className={`macos-nav-item ${isActive ? 'macos-nav-item--active' : ''}`}
                onClick={() => setActiveSection(sec.id)}
              >
                <span className="macos-nav-icon-badge" style={{ background: sec.bg }}>
                  <Icon size={13} />
                </span>
                <span>{sec.label}</span>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ==================== RIGHT MAIN CONTENT ==================== */}
      <main className="macos-settings-content">
        {/* ---------- 1. APPEARANCE ---------- */}
        {activeSection === 'appearance' && (
          <>
            <div className="macos-content-header">
              <h2 className="macos-content-title">Appearance</h2>
              <p className="macos-content-desc">Customize theme modes, colors, and interface accents</p>
            </div>

            <div className="macos-group">
              <div className="theme-preview-row">
                {/* Light */}
                <div
                  className={`theme-card-preview ${themeMode === 'light' ? 'theme-card-preview--active' : ''}`}
                  onClick={() => setThemeMode('light')}
                >
                  <div className="theme-preview-art theme-art--light">
                    <div className="mini-win">
                      <div className="mini-dots">
                        <span /><span style={{ background: '#F59E0B' }} /><span style={{ background: '#10B981' }} />
                      </div>
                    </div>
                  </div>
                  <span className="theme-card-label">Light</span>
                </div>

                {/* Dark */}
                <div
                  className={`theme-card-preview ${themeMode === 'dark' ? 'theme-card-preview--active' : ''}`}
                  onClick={() => setThemeMode('dark')}
                >
                  <div className="theme-preview-art theme-art--dark">
                    <div className="mini-win">
                      <div className="mini-dots">
                        <span /><span style={{ background: '#F59E0B' }} /><span style={{ background: '#10B981' }} />
                      </div>
                    </div>
                  </div>
                  <span className="theme-card-label">Dark</span>
                </div>

                {/* Auto */}
                <div
                  className={`theme-card-preview ${themeMode === 'auto' ? 'theme-card-preview--active' : ''}`}
                  onClick={() => setThemeMode('auto')}
                >
                  <div className="theme-preview-art theme-art--auto" />
                  <span className="theme-card-label">Auto</span>
                </div>
              </div>

              {/* Accent Color */}
              <div className="macos-row">
                <div className="macos-row-left">
                  <span className="macos-row-label">Accent Color</span>
                  <span className="macos-row-sub">Buttons, focused borders, and highlights</span>
                </div>
                <div className="macos-row-right">
                  <div className="accent-swatches-row">
                    {ACCENT_PRESETS.map((preset) => {
                      const isSel = accentId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          className={`accent-circle-btn ${isSel ? 'accent-circle-btn--active' : ''}`}
                          onClick={() => setAccent(preset.id)}
                          title={preset.name}
                        >
                          <span
                            className="accent-circle-inner"
                            style={{ background: preset.primary }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ---------- 2. DESKTOP & DOCK ---------- */}
        {activeSection === 'dock' && (
          <>
            <div className="macos-content-header">
              <h2 className="macos-content-title">Desktop & Dock</h2>
              <p className="macos-content-desc">Configure the application dock layout, behavior, and sizing</p>
            </div>

            <div className="macos-group">
              {/* Dock Size */}
              <div className="macos-row">
                <div className="macos-row-left">
                  <span className="macos-row-label">Size</span>
                  <span className="macos-row-sub">Default icon dimension on the shelf</span>
                </div>
                <div className="macos-row-right">
                  <div className="macos-range-container">
                    <input
                      type="range"
                      min="40"
                      max="76"
                      value={dockSize}
                      onChange={(e) => setDockSize(e.target.value)}
                      className="macos-range-slider"
                    />
                    <span className="macos-range-val">{dockSize}px</span>
                  </div>
                </div>
              </div>

              {/* Magnification Toggle */}
              <div className="macos-row">
                <div className="macos-row-left">
                  <span className="macos-row-label">Magnification</span>
                  <span className="macos-row-sub">Expand dock items on pointer hover</span>
                </div>
                <div className="macos-row-right">
                  <label className="macos-switch">
                    <input
                      type="checkbox"
                      checked={dockMagnification && !performanceMode}
                      disabled={performanceMode}
                      onChange={(e) => toggleDockMagnification(e.target.checked)}
                    />
                    <span className="macos-slider" />
                  </label>
                </div>
              </div>

              {/* Magnification Scale */}
              {dockMagnification && !performanceMode && (
                <div className="macos-row">
                  <div className="macos-row-left">
                    <span className="macos-row-label">Magnification Scale</span>
                    <span className="macos-row-sub">Maximum expansion size</span>
                  </div>
                  <div className="macos-row-right">
                    <div className="macos-range-container">
                      <input
                        type="range"
                        min="52"
                        max="90"
                        value={dockMagScale}
                        onChange={(e) => setDockMagScale(e.target.value)}
                        className="macos-range-slider"
                      />
                      <span className="macos-range-val">{dockMagScale}px</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Position on Screen */}
              <div className="macos-row">
                <div className="macos-row-left">
                  <span className="macos-row-label">Position on Screen</span>
                  <span className="macos-row-sub">Anchor edge for the application shelf</span>
                </div>
                <div className="macos-row-right">
                  <div className="macos-segmented">
                    {['left', 'bottom', 'right'].map((pos) => (
                      <span
                        key={pos}
                        className={`macos-segment-btn ${dockPosition === pos ? 'macos-segment-btn--active' : ''}`}
                        onClick={() => setDockPosition(pos)}
                      >
                        {pos.charAt(0).toUpperCase() + pos.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Automatically Hide & Show */}
              <div className="macos-row">
                <div className="macos-row-left">
                  <span className="macos-row-label">Automatically hide and show the Dock</span>
                  <span className="macos-row-sub">Slide offscreen when not hovered</span>
                </div>
                <div className="macos-row-right">
                  <label className="macos-switch">
                    <input
                      type="checkbox"
                      checked={dockAutoHide}
                      onChange={(e) => toggleDockAutoHide(e.target.checked)}
                    />
                    <span className="macos-slider" />
                  </label>
                </div>
              </div>

              {/* Show Indicators */}
              <div className="macos-row">
                <div className="macos-row-left">
                  <span className="macos-row-label">Show indicators for open applications</span>
                  <span className="macos-row-sub">Display luminous dot below running windows</span>
                </div>
                <div className="macos-row-right">
                  <label className="macos-switch">
                    <input
                      type="checkbox"
                      checked={dockShowIndicators}
                      onChange={(e) => toggleDockShowIndicators(e.target.checked)}
                    />
                    <span className="macos-slider" />
                  </label>
                </div>
              </div>

              {/* Dock Style */}
              <div className="macos-row">
                <div className="macos-row-left">
                  <span className="macos-row-label">Dock Glass Style</span>
                  <span className="macos-row-sub">Backdrop material translucency</span>
                </div>
                <div className="macos-row-right">
                  <div className="macos-segmented">
                    {[
                      { id: 'glass', label: 'Frosted' },
                      { id: 'dark', label: 'Dark' },
                      { id: 'transparent', label: 'Clear' },
                    ].map((s) => (
                      <span
                        key={s.id}
                        className={`macos-segment-btn ${dockStyle === s.id ? 'macos-segment-btn--active' : ''}`}
                        onClick={() => setDockStyle(s.id)}
                      >
                        {s.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ---------- 3. WALLPAPER ---------- */}
        {activeSection === 'wallpaper' && (
          <>
            <div className="macos-content-header">
              <h2 className="macos-content-title">Wallpaper</h2>
              <p className="macos-content-desc">Choose a desktop picture or pure color background</p>
            </div>

            {/* Current Active Banner */}
            <div
              className="wallpaper-banner"
              style={{
                backgroundImage: activeWallpaper.url ? `url("${activeWallpaper.url}")` : undefined,
                backgroundColor: 'var(--bg-desktop)',
              }}
            >
              <div className="wallpaper-banner-overlay" />
              <div className="wallpaper-banner-text">
                <h4>{activeWallpaper.name}</h4>
                <p>Currently applied wallpaper</p>
              </div>
            </div>

            <div className="macos-group">
              <div className="wallpaper-grid-macos">
                {WALLPAPER_PRESETS.map((p) => {
                  const isSel = wallpaper === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`wallpaper-thumb-card ${isSel ? 'wallpaper-thumb-card--active' : ''}`}
                      style={
                        p.url
                          ? { backgroundImage: `url("${p.url}")` }
                          : { backgroundColor: '#000000' }
                      }
                      onClick={() => setWallpaper(p.id)}
                    >
                      <span className="wallpaper-thumb-name">{p.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ---------- 4. POINTER & GRAPHICS ---------- */}
        {activeSection === 'pointer' && (
          <>
            <div className="macos-content-header">
              <h2 className="macos-content-title">Cursor & Graphics</h2>
              <p className="macos-content-desc">Hardware acceleration, shaders, and accessibility</p>
            </div>

            <div className="macos-group">
              {/* WebGL Cursor Glow */}
              <div className="macos-row">
                <div className="macos-row-left">
                  <span className="macos-row-label">WebGL Glowing Cursor</span>
                  <span className="macos-row-sub">GLSL fluid light trail behind cursor (idle auto-sleep)</span>
                </div>
                <div className="macos-row-right">
                  <label className="macos-switch">
                    <input
                      type="checkbox"
                      checked={cursorGlow && !performanceMode}
                      disabled={performanceMode}
                      onChange={(e) => toggleCursorGlow(e.target.checked)}
                    />
                    <span className="macos-slider" />
                  </label>
                </div>
              </div>

              {/* Master Performance Mode */}
              <div className="macos-row">
                <div className="macos-row-left">
                  <span className="macos-row-label">Master Performance Mode</span>
                  <span className="macos-row-sub">Disables WebGL canvas and transitions for maximum battery and 60fps</span>
                </div>
                <div className="macos-row-right">
                  <label className="macos-switch">
                    <input
                      type="checkbox"
                      checked={performanceMode}
                      onChange={(e) => setPerformanceMode(e.target.checked)}
                    />
                    <span className="macos-slider" />
                  </label>
                </div>
              </div>

              {/* Window Animations */}
              <div className="macos-row">
                <div className="macos-row-left">
                  <span className="macos-row-label">Window Scale Transitions</span>
                  <span className="macos-row-sub">Smooth spring animations when minimizing or restoring windows</span>
                </div>
                <div className="macos-row-right">
                  <label className="macos-switch">
                    <input
                      type="checkbox"
                      checked={animations && !performanceMode}
                      disabled={performanceMode}
                      onChange={(e) => toggleAnimations(e.target.checked)}
                    />
                    <span className="macos-slider" />
                  </label>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ---------- 5. STORAGE & FILES ---------- */}
        {activeSection === 'storage' && (
          <>
            <div className="macos-content-header">
              <h2 className="macos-content-title">Storage & Files</h2>
              <p className="macos-content-desc">Virtual file system memory, cache, and disk management</p>
            </div>

            <div className="macos-group">
              <div className="storage-gauge-container">
                <span className="macos-row-label">Virtual Disk Allocation</span>
                <div className="storage-bar">
                  <div className="storage-bar-seg" style={{ width: '45%', background: '#007AFF' }} />
                  <div className="storage-bar-seg" style={{ width: '25%', background: '#FF9500' }} />
                  <div className="storage-bar-seg" style={{ width: '15%', background: '#34C759' }} />
                  <div className="storage-bar-seg" style={{ width: '15%', background: '#8E8E93' }} />
                </div>
                <div className="storage-legend">
                  <div className="storage-legend-item">
                    <span className="storage-legend-dot" style={{ background: '#007AFF' }} />
                    <span>Documents</span>
                  </div>
                  <div className="storage-legend-item">
                    <span className="storage-legend-dot" style={{ background: '#FF9500' }} />
                    <span>Projects</span>
                  </div>
                  <div className="storage-legend-item">
                    <span className="storage-legend-dot" style={{ background: '#34C759' }} />
                    <span>Desktop</span>
                  </div>
                  <div className="storage-legend-item">
                    <span className="storage-legend-dot" style={{ background: '#8E8E93' }} />
                    <span>System VFS</span>
                  </div>
                </div>
              </div>

              <div className="macos-row">
                <div className="macos-row-left">
                  <span className="macos-row-label">Total Files & Folders</span>
                  <span className="macos-row-sub">Items stored in IndexedDB + LocalStorage</span>
                </div>
                <div className="macos-row-right">
                  <span className="macos-range-val" style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                    {fsStats.fileCount} files, {fsStats.folderCount} folders
                  </span>
                </div>
              </div>

              <div className="macos-row">
                <div className="macos-row-left">
                  <span className="macos-row-label">Factory Reset File System</span>
                  <span className="macos-row-sub">Restore original seed directories and clean cache</span>
                </div>
                <div className="macos-row-right">
                  <button className="macos-btn macos-btn--danger" onClick={handleResetVfs}>
                    <RotateCcw size={13} style={{ marginRight: '6px' }} />
                    Reset VFS
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ---------- 6. GENERAL & ABOUT ---------- */}
        {activeSection === 'about' && (
          <>
            <div className="macos-content-header">
              <h2 className="macos-content-title">General & About</h2>
              <p className="macos-content-desc">Operating system details, hardware specs, and version info</p>
            </div>

            <div className="macos-group">
              <div className="about-hero">
                <div className="about-logo-wrapper">
                  <Cpu size={36} />
                </div>
                <h3 className="about-os-title">Vyom OS</h3>
                <span className="about-os-ver">Version 1.0 (Developer Edition)</span>
              </div>

              <div className="macos-row">
                <span className="macos-row-label">Host Architecture</span>
                <span className="macos-range-val" style={{ color: 'var(--text-main)' }}>{systemInfo.os}</span>
              </div>
              <div className="macos-row">
                <span className="macos-row-label">Processor Cores</span>
                <span className="macos-range-val" style={{ color: 'var(--text-main)' }}>{systemInfo.cores} Virtual Threads</span>
              </div>
              <div className="macos-row">
                <span className="macos-row-label">System Memory</span>
                <span className="macos-range-val" style={{ color: 'var(--text-main)' }}>{systemInfo.memory}</span>
              </div>
              <div className="macos-row">
                <span className="macos-row-label">Storage Backend</span>
                <span className="macos-range-val" style={{ color: 'var(--text-main)' }}>IndexedDB + LocalStorage (Synchronous VFS)</span>
              </div>
              <div className="macos-row">
                <span className="macos-row-label">Developer</span>
                <span className="macos-range-val" style={{ color: 'var(--text-main)' }}>Roshan Preet Singh Dhiman</span>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
