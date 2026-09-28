import { create } from 'zustand';

const STORAGE_KEY = 'vyom_desktop_widgets_v2';

const getDefaultWidgets = () => {
  const isClient = typeof window !== 'undefined';
  const width = isClient ? window.innerWidth : 1200;
  
  // Place on right side of desktop by default
  const rightX = Math.max(20, width - 330);

  return [];
};

const loadSavedWidgets = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.warn('Failed to load saved widgets', err);
    }
  }
  return getDefaultWidgets();
};

export const useWidgetsStore = create((set, get) => ({
  widgets: loadSavedWidgets(),
  widgetsCenterOpen: false,

  setWidgetsCenterOpen: (open) => set({ widgetsCenterOpen: !!open }),
  toggleWidgetsCenter: () => set((s) => ({ widgetsCenterOpen: !s.widgetsCenterOpen })),

  saveWidgets: (next) => {
    set({ widgets: next });
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.warn('Failed to save desktop widgets', err);
      }
    }
  },

  addWidget: (type, customPos) => {
    const { widgets, saveWidgets } = get();
    const id = `widget-${type}-${Date.now()}`;
    const isClient = typeof window !== 'undefined';
    const width = isClient ? window.innerWidth : 1200;
    const height = isClient ? window.innerHeight : 800;

    // Default positioning if none provided
    const x = customPos?.x ?? Math.max(20, Math.min(width - 320, 140 + (widgets.length % 5) * 30));
    const y = customPos?.y ?? Math.max(44, Math.min(height - 240, 60 + (widgets.length % 5) * 30));

    const newWidget = { id, type, x, y };
    saveWidgets([...widgets, newWidget]);
    return id;
  },

  removeWidget: (id) => {
    const { widgets, saveWidgets } = get();
    saveWidgets(widgets.filter((w) => w.id !== id));
  },

  updateWidgetPos: (id, x, y) => {
    const { widgets, saveWidgets } = get();
    saveWidgets(
      widgets.map((w) => (w.id === id ? { ...w, x, y } : w))
    );
  },

  isWidgetOnDesktop: (type) => {
    return get().widgets.some((w) => w.type === type);
  },

  toggleWidgetOnDesktop: (type) => {
    const { widgets, addWidget, removeWidget } = get();
    const existing = widgets.find((w) => w.type === type);
    if (existing) {
      removeWidget(existing.id);
      return false;
    } else {
      addWidget(type);
      return true;
    }
  },

  resetDefaultWidgets: () => {
    const defaults = getDefaultWidgets();
    get().saveWidgets(defaults);
  },
}));
