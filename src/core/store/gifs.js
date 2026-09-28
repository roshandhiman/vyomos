/**
 * Desktop GIFs Store
 * Persists animated GIFs placed on the desktop — position, size, zIndex.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

let nextId = Date.now();

const useGifsStore = create(
  persist(
    (set, get) => ({
      gifs: [], // [{ id, src, x, y, width, height, zIndex }]
      topZ: 500,

      addGif: (src, x = 200, y = 200) => {
        const topZ = get().topZ + 1;
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
        const topZ = get().topZ + 1;
        set((s) => ({
          topZ,
          gifs: s.gifs.map((g) => (g.id === id ? { ...g, zIndex: topZ } : g)),
        }));
      },
    }),
    { name: 'devos-desktop-gifs' }
  )
);

export default useGifsStore;
