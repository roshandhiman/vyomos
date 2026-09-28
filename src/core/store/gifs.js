/**
 * Desktop GIFs Store
 * Persists animated GIFs placed on the desktop — position, size, zIndex.
 * GIFs always stay BEHIND desktop icons (z-index 2–20), below everything else.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

let nextId = Date.now();

// GIFs live in the 2–20 z-index band — behind icons (50+), widgets, windows
const GIF_Z_BASE = 2;
const GIF_Z_MAX = 20;

const useGifsStore = create(
  persist(
    (set, get) => ({
      gifs: [],
      topZ: GIF_Z_BASE,

      addGif: (src, x = 200, y = 200) => {
        const topZ = Math.min(get().topZ + 1, GIF_Z_MAX);
        set((s) => ({
          topZ,
          gifs: [
            ...s.gifs,
            {
              id: `gif-${++nextId}`,
              src,
              x,
              y,
              width: 240,
              height: 180,
              zIndex: topZ,
            },
          ],
        }));
      },

      removeGif: (id) =>
        set((s) => ({ gifs: s.gifs.filter((g) => g.id !== id) })),

      updateGif: (id, patch) =>
        set((s) => ({
          gifs: s.gifs.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),

      bringToFront: (id) => {
        const topZ = Math.min(get().topZ + 1, GIF_Z_MAX);
        set((s) => ({
          topZ,
          gifs: s.gifs.map((g) => (g.id === id ? { ...g, zIndex: topZ } : g)),
        }));
      },
    }),
    { name: 'devos-desktop-gifs-v2' }
  )
);

export default useGifsStore;

