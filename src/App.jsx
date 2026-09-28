import React, { useEffect } from 'react';
import Desktop from './core/Desktop';
import { useFsStore } from './core/store/fs';
import { useSettingsStore } from './core/store/settings';

export default function App() {
  const initFs = useFsStore((state) => state.initFs);
  const accentPrimary = useSettingsStore((state) => state.accentPrimary);
  const accentSecondary = useSettingsStore((state) => state.accentSecondary);
  const animations = useSettingsStore((state) => state.animations);
  const performanceMode = useSettingsStore((state) => state.performanceMode);

  useEffect(() => {
    initFs();
  }, [initFs]);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-primary', accentPrimary);
    document.documentElement.style.setProperty('--accent-secondary', accentSecondary);
  }, [accentPrimary, accentSecondary]);

  useEffect(() => {
    if (performanceMode || !animations) {
      document.body.classList.add('no-animations');
    } else {
      document.body.classList.remove('no-animations');
    }
  }, [performanceMode, animations]);

  return <Desktop />;
}
