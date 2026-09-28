import React, { useEffect, useState } from 'react';
import Desktop from './core/Desktop';
import SetupScreen from './core/SetupScreen';
import { useFsStore } from './core/store/fs';
import { useSettingsStore } from './core/store/settings';

export default function App() {
  const [username, setUsername] = useState(() => localStorage.getItem('devos-username'));
  const initFs = useFsStore((state) => state.initFs);
  const themeMode = useSettingsStore((state) => state.themeMode);
  const accentPrimary = useSettingsStore((state) => state.accentPrimary);
  const accentSecondary = useSettingsStore((state) => state.accentSecondary);
  const animations = useSettingsStore((state) => state.animations);
  const performanceMode = useSettingsStore((state) => state.performanceMode);

  useEffect(() => {
    initFs();
  }, [initFs]);

  // Apply Theme Mode (Dark / Light)
  useEffect(() => {
    const applyTheme = () => {
      let resolved = themeMode || 'dark';
      if (themeMode === 'auto' && typeof window !== 'undefined') {
        resolved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
      document.documentElement.setAttribute('data-theme', resolved);
    };

    applyTheme();

    if (themeMode === 'auto' && typeof window !== 'undefined' && window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [themeMode]);

  // Apply Accent Colors
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-primary', accentPrimary);
    document.documentElement.style.setProperty('--accent-secondary', accentSecondary);
  }, [accentPrimary, accentSecondary]);

  // Apply Performance / Animations
  useEffect(() => {
    if (performanceMode || !animations) {
      document.body.classList.add('no-animations');
    } else {
      document.body.classList.remove('no-animations');
    }
  }, [performanceMode, animations]);

  return (
    <>
      <Desktop />
      {!username && <SetupScreen onComplete={setUsername} />}
    </>
  );
}
