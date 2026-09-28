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
  { id: 'blue', name: 'Mac Blue', primary: '#007AFF', secondary: '#38BDF8' },
  { id: 'graphite', name: 'Graphite', primary: '#71717A', secondary: '#A1A1AA' },
  { id: 'emerald', name: 'Emerald Green', primary: '#10B981', secondary: '#34D399' },
  { id: 'rose-pink', name: 'Neon Rose', primary: '#F43F5E', secondary: '#FB7185' },
];

export const WALLPAPER_PRESETS = [
  { id: 'solid-dark', name: 'Solid Black', url: null },
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
      // Appearance
      themeMode: 'dark', // 'dark' | 'light' | 'auto'
      accentId: 'blue',
      accentPrimary: '#007AFF',
      accentSecondary: '#38BDF8',
      wallpaper: 'solid-dark',

      // Effects
      cursorGlow: false,
      animations: true,
      performanceMode: false,

      // Dock Customization
      dockSize: 52, // 40 - 76
      dockMagnification: true,
      dockMagScale: 70, // 50 - 90
      dockPosition: 'bottom', // 'bottom' | 'left' | 'right'
      dockAutoHide: false,
      dockShowIndicators: true,
      dockStyle: 'glass', // 'glass' | 'dark' | 'transparent'
      dockApps: ['files', 'browser', 'camera', 'photos', 'weather', 'clock', 'editor', 'terminal', 'games', 'settings'],

      setThemeMode: (mode) => {
        set({ themeMode: mode });
        if (typeof document !== 'undefined') {
          const resolved = mode === 'auto'
            ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : mode;
          document.documentElement.setAttribute('data-theme', resolved);
        }
      },

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

      setDockSize: (size) => {
        set({ dockSize: Number(size) });
      },

      setDockMagScale: (scale) => {
        set({ dockMagScale: Number(scale) });
      },

      setDockPosition: (pos) => {
        set({ dockPosition: pos });
      },

      toggleDockAutoHide: (val) => {
        set((state) => ({ dockAutoHide: val !== undefined ? val : !state.dockAutoHide }));
      },

      toggleDockShowIndicators: (val) => {
        set((state) => ({ dockShowIndicators: val !== undefined ? val : !state.dockShowIndicators }));
      },

      setDockStyle: (style) => {
        set({ dockStyle: style });
      },

      setDockApps: (newApps) => {
        set({ dockApps: newApps });
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
      name: 'vyom-settings-v4',
      onRehydrateStorage: () => (state) => {
        if (!state || typeof document === 'undefined') return;
        // apply restored values
        document.documentElement.style.setProperty('--accent-primary', state.accentPrimary);
        document.documentElement.style.setProperty('--accent-secondary', state.accentSecondary);
        const resolved = state.themeMode === 'auto'
          ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : (state.themeMode || 'dark');
        document.documentElement.setAttribute('data-theme', resolved);
        if (state.performanceMode || !state.animations) {
          document.body.classList.add('no-animations');
        } else {
          document.body.classList.remove('no-animations');
        }
      },
    }
  )
);
