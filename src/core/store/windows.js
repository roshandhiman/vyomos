import { create } from 'zustand';

let windowCounter = 0;

export const useWindowsStore = create((set, get) => ({
  windows: [],
  focusedWindowId: null,
  maxZ: 10,

  openApp: (appId, appManifest, props = {}) => {
    const { windows, maxZ } = get();

    // Check singleInstance
    if (appManifest?.singleInstance) {
      const existing = windows.find((w) => w.appId === appId);
      if (existing) {
        set({
          windows: windows.map((w) =>
            w.id === existing.id
              ? { ...w, minimized: false, z: maxZ + 1, props: { ...w.props, ...props } }
              : w
          ),
          focusedWindowId: existing.id,
          maxZ: maxZ + 1,
        });
        return existing.id;
      }
    }

    const id = `${appId}-${Date.now()}-${++windowCounter}`;
    const defaultW = appManifest?.defaultSize?.width || 720;
    const defaultH = appManifest?.defaultSize?.height || 500;

    const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;

    const offset = (windows.length % 8) * 28;
    const initialX = Math.max(20, Math.min(viewportW - defaultW - 20, Math.round((viewportW - defaultW) / 2) + offset - 60));
    const initialY = Math.max(40, Math.min(viewportH - defaultH - 90, Math.round((viewportH - defaultH) / 2) + offset - 40));

    const newWindow = {
      id,
      appId,
      title: appManifest?.title || 'Application',
      x: initialX,
      y: initialY,
      w: defaultW,
      h: defaultH,
      minimized: false,
      maximized: false,
      prevBounds: null,
      z: maxZ + 1,
      props,
    };

    set({
      windows: [...windows, newWindow],
      focusedWindowId: id,
      maxZ: maxZ + 1,
    });

    return id;
  },

  closeWindow: (id) => {
    const { windows, focusedWindowId } = get();
    const remaining = windows.filter((w) => w.id !== id);
    let nextFocus = focusedWindowId;

    if (focusedWindowId === id) {
      const visible = remaining.filter((w) => !w.minimized);
      if (visible.length > 0) {
        const top = visible.reduce((highest, curr) => (curr.z > highest.z ? curr : highest), visible[0]);
        nextFocus = top.id;
      } else {
        nextFocus = null;
      }
    }

    set({
      windows: remaining,
      focusedWindowId: nextFocus,
    });
  },

  focusWindow: (id) => {
    const { windows, maxZ, focusedWindowId } = get();
    if (focusedWindowId === id) {
      const current = windows.find((w) => w.id === id);
      if (current && current.minimized) {
        set({
          windows: windows.map((w) => (w.id === id ? { ...w, minimized: false } : w)),
        });
      }
      return;
    }

    const nextZ = maxZ + 1;
    set({
      windows: windows.map((w) =>
        w.id === id ? { ...w, minimized: false, z: nextZ } : w
      ),
      focusedWindowId: id,
      maxZ: nextZ,
    });
  },

  minimizeWindow: (id) => {
    const { windows, focusedWindowId } = get();
    const updated = windows.map((w) => (w.id === id ? { ...w, minimized: true } : w));
    let nextFocus = focusedWindowId;

    if (focusedWindowId === id) {
      const visible = updated.filter((w) => !w.minimized);
      if (visible.length > 0) {
        const top = visible.reduce((highest, curr) => (curr.z > highest.z ? curr : highest), visible[0]);
        nextFocus = top.id;
      } else {
        nextFocus = null;
      }
    }

    set({
      windows: updated,
      focusedWindowId: nextFocus,
    });
  },

  toggleMaximize: (id) => {
    const { windows, maxZ } = get();
    const target = windows.find((w) => w.id === id);
    if (!target) return;

    if (target.maximized) {
      // Restore
      const prev = target.prevBounds || { x: 100, y: 60, w: 720, h: 480 };
      set({
        windows: windows.map((w) =>
          w.id === id
            ? {
                ...w,
                maximized: false,
                x: prev.x,
                y: prev.y,
                w: prev.w,
                h: prev.h,
                z: maxZ + 1,
              }
            : w
        ),
        focusedWindowId: id,
        maxZ: maxZ + 1,
      });
    } else {
      // Maximize
      const prevBounds = { x: target.x, y: target.y, w: target.w, h: target.h };
      set({
        windows: windows.map((w) =>
          w.id === id
            ? {
                ...w,
                maximized: true,
                prevBounds,
                z: maxZ + 1,
              }
            : w
        ),
        focusedWindowId: id,
        maxZ: maxZ + 1,
      });
    }
  },

  updateWindowBounds: (id, bounds) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, ...bounds } : w)),
    }));
  },

  handleDockClick: (appId, appManifest) => {
    const { windows, focusedWindowId, focusWindow, minimizeWindow, openApp } = get();
    const appWindows = windows.filter((w) => w.appId === appId);

    if (appWindows.length === 0) {
      openApp(appId, appManifest);
      return;
    }

    // Find if the focused window is one of this app's windows
    const isAppFocused = appWindows.some((w) => w.id === focusedWindowId && !w.minimized);

    if (isAppFocused) {
      // Minimize the currently focused window of this app
      minimizeWindow(focusedWindowId);
    } else {
      // Focus the top-most window of this app (or restore it)
      const topAppWindow = appWindows.reduce(
        (prev, curr) => (curr.z > prev.z ? curr : prev),
        appWindows[0]
      );
      focusWindow(topAppWindow.id);
    }
  },
}));
