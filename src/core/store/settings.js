import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const checkLowEndDevice = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const cores = navigator.hardwareConcurrency;
  // @ts-ignore
  const memory = navigator.deviceMemory;
  if ((typeof cores === 'number' && cores <= 4) || (typeof memory === 'number' && memory <= 4)) {
    return true;
  }
  return false;
};

export const ACCENT_PRESETS = [
  { id: 'cyan-violet', name: 'Cyber Cyan', primary: '#67E8F9', secondary: '#A78BFA' },
  { id: 'emerald-teal', name: 'Aurora Emerald', primary: '#34D399', secondary: '#38BDF8' },
  { id: 'rose-pink', name: 'Neon Rose', primary: '#F472B6', secondary: '#A855F7' },
  { id: 'amber-orange', name: 'Solar Amber', primary: '#FBBF24', secondary: '#F97316' },
];

export const WALLPAPER_PRESETS = [
  { id: 'solid-dark', name: 'Solid Dark', url: null },
  { id: 'wlp1', name: 'Nebula', url: new URL('/src/wlp/1.png', import.meta.url).href },
  { id: 'wlp2', name: 'Aurora', url: new URL('/src/wlp/2.png', import.meta.url).href },
  { id: 'wlp3', name: 'Cosmic', url: new URL('/src/wlp/3.png', import.meta.url).href },
  { id: 'wlp4', name: 'Horizon', url: new URL('/src/wlp/4.jpg', import.meta.url).href },
  { id: 'wlp5', name: 'Galaxy', url: new URL('/src/wlp/5.png', import.meta.url).href },
  { id: 'wlp6', name: 'Starfield', url: new URL('/src/wlp/6.jpg', import.meta.url).href },
  { id: 'wlp7', name: 'Deep Space', url: new URL('/src/wlp/7.png', import.meta.url).href },
  { id: 'wlp8', name: 'Midnight', url: new URL('/src/wlp/8.jpg', import.meta.url).href },
  { id: 'wlp9', name: 'Twilight', url: new URL('/src/wlp/9.jpg', import.meta.url).href },
  { id: 'wlp10', name: 'Abyss', url: new URL('/src/wlp/10.jpg', import.meta.url).href },
];

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      accentId: 'cyan-violet',
      accentPrimary: '#67E8F9',
      accentSecondary: '#A78BFA',
      wallpaper: 'solid-dark',
      cursorGlow: false,
      dockMagnification: true,
      animations: true,
      performanceMode: false,

      setAccent: (presetId) => {
        const found = ACCENT_PRESETS.find((p) => p.id === presetId);
        if (found) {
          set({
            accentId: found.id,
            accentPrimary: found.primary,
            accentSecondary: found.secondary,
          });
          if (typeof document !== 'undefined') {
            document.documentElement.style.setProperty('--accent-primary', found.primary);
            document.documentElement.style.setProperty('--accent-secondary', found.secondary);
          }
        }
      },

      setCustomAccent: (primary, secondary) => {
        set({
          accentId: 'custom',
          accentPrimary: primary,
          accentSecondary: secondary || primary,
        });
        if (typeof document !== 'undefined') {
          document.documentElement.style.setProperty('--accent-primary', primary);
          document.documentElement.style.setProperty('--accent-secondary', secondary || primary);
        }
      },

      setWallpaper: (wallpaperId) => {
        set({ wallpaper: wallpaperId });
      },

      toggleCursorGlow: (val) => {
        set((state) => ({ cursorGlow: val !== undefined ? val : !state.cursorGlow }));
      },

      toggleDockMagnification: (val) => {
        set((state) => ({
          dockMagnification: val !== undefined ? val : !state.dockMagnification,
        }));
      },

      toggleAnimations: (val) => {
        set((state) => {
          const next = val !== undefined ? val : !state.animations;
          if (typeof document !== 'undefined') {
            if (next) {
              document.body.classList.remove('no-animations');
            } else {
              document.body.classList.add('no-animations');
            }
          }
          return { animations: next };
        });
      },

      setPerformanceMode: (enabled) => {
        set({
          performanceMode: enabled,
          ...(enabled
            ? {
              cursorGlow: false,
              dockMagnification: false,
              animations: false,
            }
            : {
              cursorGlow: true,
              dockMagnification: true,
              animations: true,
            }),
        });
        if (typeof document !== 'undefined') {
          if (enabled) {
            document.body.classList.add('no-animations');
          } else {
            document.body.classList.remove('no-animations');
          }
        }
      },
    }),
    {
      name: 'devos-settings-v3',
      onRehydrateStorage: () => (state) => {
        if (!state || typeof document === 'undefined') return;
        // apply restored values
        document.documentElement.style.setProperty('--accent-primary', state.accentPrimary);
        document.documentElement.style.setProperty('--accent-secondary', state.accentSecondary);
        if (state.performanceMode || !state.animations) {
          document.body.classList.add('no-animations');
        } else {
          document.body.classList.remove('no-animations');
        }
      },
    }
  )
);
