import React, { useState, useEffect } from 'react';
import { useSettingsStore, WALLPAPER_PRESETS, LIVE_WALLPAPERS } from './store/settings';
import './LoadingScreen.css';

const LOADING_STEPS = [
  'Initializing kernel...',
  'Loading system modules...',
  'Mounting file system...',
  'Preloading wallpapers...',
  'Loading fonts and themes...',
  'Starting desktop environment...',
  'Welcome to Vyom OS',
];

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const userName = useSettingsStore((s) => s.userName);

  useEffect(() => {
    let cancelled = false;

    const preloadImages = async () => {
      const imageUrls = WALLPAPER_PRESETS.filter((p) => p.url).map((p) => p.url);
      let loaded = 0;
      const total = imageUrls.length + LOADING_STEPS.length;

      // Step through log messages
      for (let i = 0; i < LOADING_STEPS.length; i++) {
        if (cancelled) return;
        await delay(120 + Math.random() * 80);
        setStepIndex(i);
        setProgress(Math.round(((i + 1) / total) * 100));
      }

      // Preload wallpaper images in parallel
      await Promise.all(
        imageUrls.map(
          (url) =>
            new Promise((resolve) => {
              const img = new Image();
              img.onload = img.onerror = () => {
                if (cancelled) return;
                loaded++;
                const prog = Math.round(
                  ((LOADING_STEPS.length + loaded) / total) * 100
                );
                setProgress(Math.min(100, prog));
                resolve();
              };
              img.src = url;
            })
        )
      );

      if (cancelled) return;
      setProgress(100);
      await delay(400);
      if (cancelled) return;
      setFadeOut(true);
      await delay(700);
      if (!cancelled) onComplete();
    };

    preloadImages();
    return () => { cancelled = true; };
  }, []);

  const currentStep = LOADING_STEPS[stepIndex] || LOADING_STEPS[LOADING_STEPS.length - 1];

  return (
    <div className={`loading-screen ${fadeOut ? 'loading-screen--fade-out' : ''}`}>
      <div className="loading-bg-grid" />
      <div className="loading-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="loading-particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
          }} />
        ))}
      </div>

      <div className="loading-content">
        {/* Logo */}
        <div className="loading-logo">
          <div className="loading-logo-ring" />
          <div className="loading-logo-ring loading-logo-ring--2" />
          <div className="loading-logo-core">V</div>
        </div>

        <h1 className="loading-os-name">Vyom OS</h1>
        {userName && userName !== 'Roshan' && (
          <p className="loading-user">Good to see you, <strong>{userName}</strong></p>
        )}

        {/* Terminal log */}
        <div className="loading-terminal">
          <span className="loading-terminal-prompt">vyom&nbsp;~&nbsp;$&nbsp;</span>
          <span className="loading-terminal-text">{currentStep}</span>
          <span className="loading-terminal-cursor" />
        </div>

        {/* Progress bar */}
        <div className="loading-bar-track">
          <div
            className="loading-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="loading-percent">{progress}%</div>
      </div>
    </div>
  );
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
