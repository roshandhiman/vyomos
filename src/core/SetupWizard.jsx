import React, { useState } from 'react';
import { useSettingsStore, WALLPAPER_PRESETS, LIVE_WALLPAPERS, ACCENT_PRESETS } from './store/settings';
import './SetupWizard.css';

export default function SetupWizard() {
  const [step, setStep] = useState(1);
  const [localName, setLocalName] = useState('');
  
  const { 
    setUserName, 
    setFirstTimeComplete,
    themeMode, setThemeMode,
    accentId, setAccent,
    wallpaper, setWallpaper,
    liveWallpaper, setLiveWallpaper,
    cursorGlow, toggleCursorGlow
  } = useSettingsStore();

  const handleNext = () => {
    if (step === 1) {
      if (localName.trim()) {
        setUserName(localName.trim());
      }
    }
    if (step === 4) {
      setFirstTimeComplete();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1);
  };

  return (
    <div className="setup-wizard-backdrop">
      <div className="setup-wizard-modal">
        {step === 1 && (
          <div className="setup-step">
            <h1>Welcome to Vyom OS</h1>
            <p>Let's personalize your experience. What should we call you?</p>
            <input 
              type="text" 
              placeholder="Your Name (e.g. Roshan)"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              className="setup-input"
              autoFocus
            />
          </div>
        )}

        {step === 2 && (
          <div className="setup-step">
            <h2>Choose your Theme</h2>
            <div className="setup-options">
              <button 
                className={`setup-option-btn ${themeMode === 'dark' ? 'active' : ''}`}
                onClick={() => setThemeMode('dark')}
              >
                Dark Mode
              </button>
              <button 
                className={`setup-option-btn ${themeMode === 'light' ? 'active' : ''}`}
                onClick={() => setThemeMode('light')}
              >
                Light Mode
              </button>
            </div>

            <h2 style={{ marginTop: '20px' }}>Accent Color</h2>
            <div className="setup-color-picker">
              {ACCENT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  className={`color-btn ${accentId === preset.id ? 'active' : ''}`}
                  style={{ backgroundColor: preset.primary }}
                  onClick={() => setAccent(preset.id)}
                  title={preset.name}
                />
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="setup-step wallpaper-step">
            <h2>Select a Wallpaper</h2>
            <div className="wallpaper-grid-scroll">
              <h3 style={{marginTop: 0}}>Static Wallpapers</h3>
              <div className="wallpaper-grid">
                {WALLPAPER_PRESETS.slice(1).map((preset) => (
                  <div 
                    key={preset.id}
                    className={`wallpaper-thumb ${wallpaper === preset.id ? 'active' : ''}`}
                    style={{ backgroundImage: `url(${preset.url})` }}
                    onClick={() => setWallpaper(preset.id)}
                  >
                    <div className="wallpaper-name">{preset.name}</div>
                  </div>
                ))}
              </div>
              
              <h3>Live Wallpapers</h3>
              <div className="wallpaper-grid">
                {LIVE_WALLPAPERS.map((preset) => (
                  <div 
                    key={preset.id}
                    className={`wallpaper-thumb ${liveWallpaper === preset.id ? 'active' : ''}`}
                    onClick={() => setLiveWallpaper(preset.id)}
                  >
                    <video src={preset.url} muted loop autoPlay playsInline className="wallpaper-thumb-video" />
                    <div className="wallpaper-name">{preset.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="setup-step">
            <h2>Enable Glow Cursor?</h2>
            <p>Do you want the interactive glowing cursor effect?</p>
            <div className="setup-options">
              <button 
                className={`setup-option-btn ${cursorGlow ? 'active' : ''}`}
                onClick={() => toggleCursorGlow(true)}
              >
                Yes, Enable Glow
              </button>
              <button 
                className={`setup-option-btn ${!cursorGlow ? 'active' : ''}`}
                onClick={() => toggleCursorGlow(false)}
              >
                No, Standard Cursor
              </button>
            </div>
          </div>
        )}

        <div className="setup-wizard-footer">
          <div className="setup-dots">
            {[1, 2, 3, 4].map(num => (
              <div key={num} className={`setup-dot ${step === num ? 'active' : ''}`} />
            ))}
          </div>
          <div className="setup-actions">
            {step > 1 && (
              <button className="setup-btn-secondary" onClick={handleBack}>
                Back
              </button>
            )}
            <button className="setup-btn-primary" onClick={handleNext}>
              {step === 4 ? "Finish Setup" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
